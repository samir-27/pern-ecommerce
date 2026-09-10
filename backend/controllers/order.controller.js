import pool from '../db.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

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

const getOrderPricing = async (client, orderItems) => {
    let subtotal = 0;
    const validOrderItems = [];

    for (const item of orderItems) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Invalid item quantity');
        }

        const variantResult = await client.query(
            `SELECT pv.stock_quantity, pv.price_override, p.base_price
             FROM product_variants pv
             JOIN products p ON pv.product_id = p.id
             WHERE pv.id = $1`,
            [item.variant_id]
        );

        if (variantResult.rows.length === 0) {
            throw new Error(`Variant ID ${item.variant_id} not found.`);
        }

        const variant = variantResult.rows[0];
        if (variant.stock_quantity < quantity) {
            throw new Error(`Not enough stock for item ID ${item.variant_id}`);
        }

        const truePrice = Number(variant.price_override ?? variant.base_price);
        subtotal += truePrice * quantity;
        validOrderItems.push({
            variant_id: item.variant_id,
            quantity,
            price_at_purchase: truePrice,
        });
    }

    const shipping = subtotal > 150 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = Number((subtotal + shipping + tax).toFixed(2));

    return { validOrderItems, subtotal, shipping, tax, total };
};

const saveOrder = async (client, userId, shippingAddress, pricing, razorpayPaymentId = null) => {
    const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address, razorpay_payment_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, total_amount, status, created_at`,
        [userId, pricing.total, shippingAddress, razorpayPaymentId]
    );
    const newOrder = orderResult.rows[0];

    for (const validItem of pricing.validOrderItems) {
        await client.query(
            `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
             VALUES ($1, $2, $3, $4)`,
            [newOrder.id, validItem.variant_id, validItem.quantity, validItem.price_at_purchase]
        );

        await client.query(
            `UPDATE product_variants
             SET stock_quantity = stock_quantity - $1
             WHERE id = $2`,
            [validItem.quantity, validItem.variant_id]
        );
    }

    return newOrder;
};

export const createPaymentOrder = async (req, res) => {
    const { orderItems } = req.body;
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ error: 'No order items' });
    }

    const client = await pool.connect();
    try {
        const razorpay = getRazorpayClient();
        const pricing = await getOrderPricing(client, orderItems);
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
        const razorpay = getRazorpayClient();
        await client.query('BEGIN');
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
            message: 'Payment verified and order created successfully',
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
    const userId = req.user.id

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


// controllers/orderController.js

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch the main order details (The Receipt Headers)
        const ordersResult = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        const orders = ordersResult.rows;

        // 2. If they have no orders, return an empty array early
        if (orders.length === 0) {
            return res.json([]);
        }

        // 3. For every order, fetch its specific line items and attach them!
        // We use Promise.all to fetch them concurrently for maximum speed.
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const itemsResult = await pool.query(`
                    SELECT 
                        oi.quantity, 
                        oi.price_at_purchase,
                        pv.size,
                        pv.color,
                        pv.image_urls,
                        p.name AS product_name
                    FROM order_items oi
                    JOIN product_variants pv ON oi.variant_id = pv.id
                    JOIN products p ON pv.product_id = p.id
                    WHERE oi.order_id = $1
                `, [order.id]);

                // Attach the items array directly onto the order object
                return {
                    ...order,
                    items: itemsResult.rows
                };
            })
        );

        // 4. Send the complete package back to React!
        res.json(ordersWithItems);

    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};