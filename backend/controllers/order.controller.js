import pool from '../db.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { logAuditEvent } from '../utils/auditLogger.js';

const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret || keyId.includes('your_key') || keySecret.includes('your_key')) {
        throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

// Helper: Determine commission rate for a seller & category
const getEffectiveCommissionRate = async (client, sellerId, categoryId) => {
    // 1. Check seller-specific override
    const sellerRule = await client.query(
        "SELECT rate FROM commission_rules WHERE rule_type = 'seller' AND target_id = $1 AND is_active = true",
        [sellerId]
    );
    if (sellerRule.rows.length > 0) return Number(sellerRule.rows[0].rate);

    // 2. Check category-specific override
    if (categoryId) {
        const catRule = await client.query(
            "SELECT rate FROM commission_rules WHERE rule_type = 'category' AND target_id = $1 AND is_active = true",
            [categoryId]
        );
        if (catRule.rows.length > 0) return Number(catRule.rows[0].rate);
    }

    // 3. Check store-level commission
    const storeRes = await client.query('SELECT commission_rate FROM seller_stores WHERE user_id = $1', [sellerId]);
    if (storeRes.rows.length > 0 && storeRes.rows[0].commission_rate != null) {
        return Number(storeRes.rows[0].commission_rate);
    }

    // 4. Default global commission rule
    const globalRule = await client.query("SELECT rate FROM commission_rules WHERE rule_type = 'global' AND is_active = true LIMIT 1");
    if (globalRule.rows.length > 0) return Number(globalRule.rows[0].rate);

    return 10.00; // Safe 10% default
};

const getOrderPricing = async (client, orderItems) => {
    let subtotal = 0;
    const validOrderItems = [];
    const sellerGroups = {};

    for (const item of orderItems) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Invalid item quantity');
        }

        const variantResult = await client.query(
            `SELECT pv.id AS variant_id, pv.stock_quantity, pv.price_override, 
                    p.id AS product_id, p.name AS product_name, p.base_price, 
                    p.category_id, p.seller_id, p.store_id
             FROM product_variants pv
             JOIN products p ON pv.product_id = p.id
             WHERE pv.id = $1 FOR UPDATE`,
            [item.variant_id]
        );

        if (variantResult.rows.length === 0) {
            throw new Error(`Variant ID ${item.variant_id} not found.`);
        }

        const variant = variantResult.rows[0];
        if (variant.stock_quantity < quantity) {
            throw new Error(`Not enough stock for "${variant.product_name}". Only ${variant.stock_quantity} left.`);
        }

        const truePrice = Number(variant.price_override ?? variant.base_price);
        const itemTotal = truePrice * quantity;
        subtotal += itemTotal;

        const sellerId = variant.seller_id || 1; // Default to admin seller 1 if legacy
        const storeId = variant.store_id;

        const commissionRate = await getEffectiveCommissionRate(client, sellerId, variant.category_id);
        const commissionAmount = Number(((itemTotal * commissionRate) / 100).toFixed(2));
        const sellerNetAmount = Number((itemTotal - commissionAmount).toFixed(2));

        const validItem = {
            variant_id: item.variant_id,
            quantity,
            price_at_purchase: truePrice,
            seller_id: sellerId,
            store_id: storeId,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            seller_net_amount: sellerNetAmount,
        };

        validOrderItems.push(validItem);

        // Group by seller for multi-vendor order fulfillment
        if (!sellerGroups[sellerId]) {
            sellerGroups[sellerId] = {
                sellerId,
                storeId,
                subtotal: 0,
                commissionAmount: 0,
                sellerNetEarnings: 0,
                items: []
            };
        }
        sellerGroups[sellerId].subtotal += itemTotal;
        sellerGroups[sellerId].commissionAmount += commissionAmount;
        sellerGroups[sellerId].sellerNetEarnings += sellerNetAmount;
        sellerGroups[sellerId].items.push(validItem);
    }

    const shipping = subtotal > 150 ? 0 : 15;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));

    return { validOrderItems, sellerGroups, subtotal, shipping, tax, total };
};

const saveOrder = async (client, userId, shippingAddress, pricing, razorpayPaymentId = null) => {
    // 1. Create parent Marketplace Order
    const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address, razorpay_payment_id, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id, total_amount, status, created_at`,
        [userId, pricing.total, shippingAddress, razorpayPaymentId]
    );
    const newOrder = orderResult.rows[0];

    // 2. Create seller fulfillment sub-orders (seller_orders)
    const sellerOrderMap = {};
    for (const sellerIdStr of Object.keys(pricing.sellerGroups)) {
        const group = pricing.sellerGroups[sellerIdStr];
        const sellerOrderRes = await client.query(
            `INSERT INTO seller_orders (
                order_id, seller_id, store_id, subtotal, shipping_fee,
                commission_amount, seller_net_earnings, status
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'unfulfilled')
             RETURNING id, seller_id`,
            [
                newOrder.id,
                group.sellerId,
                group.storeId,
                group.subtotal,
                0, // Platform covers shipping, or apportion as configured
                group.commissionAmount,
                group.sellerNetEarnings
            ]
        );
        sellerOrderMap[group.sellerId] = sellerOrderRes.rows[0].id;
    }

    // 3. Save order items with seller references and atomic inventory decrement
    for (const validItem of pricing.validOrderItems) {
        const sellerOrderId = sellerOrderMap[validItem.seller_id] || null;

        await client.query(
            `INSERT INTO order_items (
                order_id, variant_id, quantity, price_at_purchase,
                seller_id, seller_order_id, commission_rate, commission_amount,
                seller_net_amount, fulfillment_status
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unfulfilled')`,
            [
                newOrder.id,
                validItem.variant_id,
                validItem.quantity,
                validItem.price_at_purchase,
                validItem.seller_id,
                sellerOrderId,
                validItem.commission_rate,
                validItem.commission_amount,
                validItem.seller_net_amount
            ]
        );

        // Atomic inventory decrement ensuring no overselling
        const updateStock = await client.query(
            `UPDATE product_variants
             SET stock_quantity = stock_quantity - $1
             WHERE id = $2 AND stock_quantity >= $1
             RETURNING id, stock_quantity`,
            [validItem.quantity, validItem.variant_id]
        );

        if (updateStock.rows.length === 0) {
            throw new Error(`Insufficient inventory for variant ID ${validItem.variant_id} during checkout confirmation.`);
        }
    }

    await logAuditEvent({
        userId,
        action: 'MARKETPLACE_ORDER_CREATED',
        targetEntity: 'orders',
        targetId: newOrder.id,
        details: { total: pricing.total, sellers: Object.keys(pricing.sellerGroups) }
    });

    return newOrder;
};

export const createPaymentOrder = async (req, res) => {
    const { orderItems } = req.body;
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ error: 'No order items' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const razorpay = getRazorpayClient();
        const pricing = await getOrderPricing(client, orderItems);
        await client.query('COMMIT');

        const paymentOrder = await razorpay.orders.create({
            amount: Math.round(pricing.total * 100),
            currency: 'INR',
            receipt: `checkout_${req.user.id}_${Date.now()}`,
        });

        res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            paymentOrder,
            pricing: {
                subtotal: pricing.subtotal,
                shipping: pricing.shipping,
                tax: pricing.tax,
                total: pricing.total,
            },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        const errorMessage = err.error?.description || err.error?.reason || err.message || 'Unable to initialize payment';
        console.error('Payment order creation error:', errorMessage);
        res.status(400).json({ error: errorMessage });
    } finally {
        client.release();
    }
};

export const verifyPayment = async (req, res) => {
    const {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        orderItems,
        shippingAddress,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !Array.isArray(orderItems) || !shippingAddress) {
        return res.status(400).json({ error: 'Incomplete payment details' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Razorpay is not configured on the server' });
    }

    // Verify HMAC
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const receivedSignatureBuffer = Buffer.from(razorpaySignature);
    if (expectedSignatureBuffer.length !== receivedSignatureBuffer.length ||
        !crypto.timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer)) {
        return res.status(400).json({ error: 'Payment verification failed' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check for idempotency: has this razorpay payment already been processed?
        const existingOrder = await client.query(
            'SELECT id FROM orders WHERE razorpay_payment_id = $1',
            [razorpayPaymentId]
        );
        if (existingOrder.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.json({
                message: 'Payment already processed',
                order: existingOrder.rows[0]
            });
        }

        const razorpay = getRazorpayClient();
        const pricing = await getOrderPricing(client, orderItems);
        const paymentOrder = await razorpay.orders.fetch(razorpayOrderId);

        if (paymentOrder.receipt !== undefined && !paymentOrder.receipt.startsWith(`checkout_${req.user.id}_`)) {
            throw new Error('Payment does not belong to the current user');
        }

        if (Number(paymentOrder.amount) !== Math.round(pricing.total * 100) || paymentOrder.currency !== 'INR') {
            throw new Error('Payment amount mismatch');
        }

        const newOrder = await saveOrder(client, req.user.id, shippingAddress, pricing, razorpayPaymentId);
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Payment verified and marketplace order created successfully',
            order: newOrder,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Payment verification error:', err.message);
        res.status(400).json({ error: err.message || 'Unable to create order' });
    } finally {
        client.release();
    }
};

export const createOrder = async (req, res) => {
    const { orderItems, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ error: 'No order items' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const pricing = await getOrderPricing(client, orderItems);
        const newOrder = await saveOrder(client, userId, shippingAddress, pricing);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Checkout Error:', err.message);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const ordersResult = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        const orders = ordersResult.rows;

        if (orders.length === 0) {
            return res.json([]);
        }

        // Fetch fulfillment sub-orders and items for each order
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const [itemsResult, sellerOrdersResult] = await Promise.all([
                    pool.query(`
                        SELECT 
                            oi.id AS order_item_id,
                            oi.quantity, 
                            oi.price_at_purchase,
                            oi.fulfillment_status,
                            pv.size,
                            pv.color,
                            pv.image_urls,
                            p.id AS product_id,
                            p.name AS product_name,
                            s.name AS store_name,
                            s.slug AS store_slug,
                            so.tracking_number,
                            so.shipping_carrier
                        FROM order_items oi
                        JOIN product_variants pv ON oi.variant_id = pv.id
                        JOIN products p ON pv.product_id = p.id
                        LEFT JOIN seller_stores s ON p.store_id = s.id
                        LEFT JOIN seller_orders so ON oi.seller_order_id = so.id
                        WHERE oi.order_id = $1
                    `, [order.id]),
                    pool.query(`
                        SELECT so.*, s.name AS store_name, s.slug AS store_slug
                        FROM seller_orders so
                        LEFT JOIN seller_stores s ON so.store_id = s.id
                        WHERE so.order_id = $1
                    `, [order.id])
                ]);

                return {
                    ...order,
                    items: itemsResult.rows,
                    sellerFulfillments: sellerOrdersResult.rows
                };
            })
        );

        res.json(ordersWithDetails);

    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};

// Return & Exchange Requests
export const requestReturn = async (req, res) => {
    const { orderItemId, reason, details, imageUrls } = req.body;
    const userId = req.user.id;

    if (!orderItemId || !reason) {
        return res.status(400).json({ error: 'Order item and return reason are required' });
    }

    try {
        // Verify item belongs to user's order
        const itemRes = await pool.query(`
            SELECT oi.*, o.user_id, o.id AS order_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = $1 AND o.user_id = $2
        `, [orderItemId, userId]);

        if (itemRes.rows.length === 0) {
            return res.status(404).json({ error: 'Order item not found or does not belong to user' });
        }

        const item = itemRes.rows[0];

        const returnRes = await pool.query(`
            INSERT INTO return_requests (
                order_id, order_item_id, seller_id, user_id,
                reason, details, image_urls, status, refund_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
            RETURNING *
        `, [
            item.order_id,
            item.id,
            item.seller_id,
            userId,
            reason,
            details || null,
            imageUrls || [],
            Number(item.price_at_purchase) * Number(item.quantity)
        ]);

        await logAuditEvent({
            userId,
            action: 'RETURN_REQUESTED',
            targetEntity: 'return_requests',
            targetId: returnRes.rows[0].id,
            details: { orderItemId, reason }
        });

        res.status(201).json({
            message: 'Return request submitted. The seller and administrator will review it.',
            returnRequest: returnRes.rows[0]
        });

    } catch (err) {
        console.error('Error requesting return:', err.message);
        res.status(500).json({ error: 'Server error requesting return' });
    }
};

export const getMyReturns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.*, p.name AS product_name, pv.size, pv.color, pv.image_urls
            FROM return_requests rr
            JOIN order_items oi ON rr.order_item_id = oi.id
            JOIN product_variants pv ON oi.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE rr.user_id = $1
            ORDER BY rr.created_at DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching returns:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};
