import pool from '../db.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Apply for a seller account
export const applySeller = async (req, res) => {
    const { businessName, businessEmail, phone, taxId, documentUrls } = req.body;
    const userId = req.user.id;

    if (!businessName || !businessEmail) {
        return res.status(400).json({ error: 'Business name and email are required.' });
    }

    try {
        // Check if an application already exists
        const existingApp = await pool.query(
            'SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (existingApp.rows.length > 0 && existingApp.rows[0].status === 'pending') {
            return res.status(400).json({ error: 'You already have an active application pending review.' });
        }

        const appRes = await pool.query(
            `INSERT INTO seller_applications (user_id, business_name, business_email, phone, tax_id, document_urls, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING *`,
            [userId, businessName.trim(), businessEmail.trim(), phone || null, taxId || null, documentUrls || []]
        );

        await logAuditEvent({
            userId,
            action: 'SELLER_APPLICATION_SUBMITTED',
            targetEntity: 'seller_applications',
            targetId: appRes.rows[0].id,
            details: { businessName, businessEmail }
        });

        res.status(201).json({
            message: 'Application submitted successfully. A Super Admin will review your credentials.',
            application: appRes.rows[0]
        });
    } catch (err) {
        console.error('Error applying for seller:', err.message);
        res.status(500).json({ error: 'Server error processing seller application' });
    }
};

// Check seller application status
export const getApplicationStatus = async (req, res) => {
    try {
        const appRes = await pool.query(
            'SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1', [req.user.id]);

        res.json({
            application: appRes.rows[0] || null,
            store: storeRes.rows[0] || null,
            isSeller: req.user.role === 'seller' || req.user.role === 'admin' || req.user.role === 'super_admin'
        });
    } catch (err) {
        console.error('Error getting seller status:', err.message);
        res.status(500).json({ error: 'Server error fetching status' });
    }
};

// Get current seller store details
export const getMyStore = async (req, res) => {
    try {
        const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1', [req.user.id]);
        if (storeRes.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }
        res.json(storeRes.rows[0]);
    } catch (err) {
        console.error('Error getting store:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update store details
export const updateMyStore = async (req, res) => {
    const { name, bio, logoUrl, bannerUrl, policyReturn, policyShipping } = req.body;
    try {
        const updated = await pool.query(
            `UPDATE seller_stores
             SET name = COALESCE($1, name),
                 bio = COALESCE($2, bio),
                 logo_url = COALESCE($3, logo_url),
                 banner_url = COALESCE($4, banner_url),
                 policy_return = COALESCE($5, policy_return),
                 policy_shipping = COALESCE($6, policy_shipping)
             WHERE user_id = $7
             RETURNING *`,
            [name, bio, logoUrl, bannerUrl, policyReturn, policyShipping, req.user.id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        res.json({ message: 'Store profile updated', store: updated.rows[0] });
    } catch (err) {
        console.error('Error updating store:', err.message);
        res.status(500).json({ error: 'Server error updating store' });
    }
};

// Seller Dashboard Overview Metrics
export const getSellerOverview = async (req, res) => {
    try {
        const storeId = req.sellerStore?.id;
        const userId = req.user.id;

        const [productsCount, ordersStats, lowStockCount] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS count FROM products WHERE seller_id = $1', [userId]),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_orders,
                    COALESCE(SUM(seller_net_earnings), 0)::numeric(10,2) AS total_earnings,
                    COUNT(*) FILTER (WHERE status = 'unfulfilled' OR status = 'pending')::int AS pending_fulfillment
                FROM seller_orders 
                WHERE seller_id = $1
            `, [userId]),
            pool.query(`
                SELECT COUNT(*)::int AS count
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE p.seller_id = $1 AND pv.stock_quantity <= pv.low_stock_threshold
            `, [userId])
        ]);

        res.json({
            totalProducts: productsCount.rows[0]?.count || 0,
            totalOrders: ordersStats.rows[0]?.total_orders || 0,
            totalEarnings: Number(ordersStats.rows[0]?.total_earnings || 0),
            pendingFulfillment: ordersStats.rows[0]?.pending_fulfillment || 0,
            lowStockCount: lowStockCount.rows[0]?.count || 0
        });
    } catch (err) {
        console.error('Error fetching seller overview:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Seller-isolated Products List
export const getSellerProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT p.*, c.name AS category_name,
                   COALESCE(
                       json_agg(json_build_object(
                           'id', pv.id,
                           'sku', pv.sku,
                           'size', pv.size,
                           'color', pv.color,
                           'stock_quantity', pv.stock_quantity,
                           'price_override', pv.price_override,
                           'compare_at_price', pv.compare_at_price,
                           'low_stock_threshold', pv.low_stock_threshold,
                           'image_urls', pv.image_urls
                       ) ORDER BY pv.id) FILTER (WHERE pv.id IS NOT NULL),
                       '[]'::json
                   ) AS variants,
                   (SELECT pv.image_urls[1]
                    FROM product_variants pv
                    WHERE pv.product_id = p.id AND cardinality(pv.image_urls) > 0
                    ORDER BY pv.id
                    LIMIT 1) AS main_image
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            WHERE p.seller_id = $1
            GROUP BY p.id, c.name
            ORDER BY p.created_at DESC
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching seller products:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Seller-isolated Orders (Seller Sub-Orders)
export const getSellerOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT so.id, so.order_id, so.subtotal, so.shipping_fee, so.commission_amount,
                   so.seller_net_earnings, so.status, so.tracking_number, so.shipping_carrier,
                   so.shipped_at, so.delivered_at, so.created_at,
                   o.shipping_address, o.status AS payment_status,
                   u.email AS customer_email,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS customer_name,
                   COALESCE(
                       json_agg(json_build_object(
                           'order_item_id', oi.id,
                           'variant_id', oi.variant_id,
                           'quantity', oi.quantity,
                           'price_at_purchase', oi.price_at_purchase,
                           'fulfillment_status', oi.fulfillment_status,
                           'product_name', p.name,
                           'sku', pv.sku,
                           'size', pv.size,
                           'color', pv.color,
                           'image_urls', pv.image_urls
                       )) FILTER (WHERE oi.id IS NOT NULL),
                       '[]'::json
                   ) AS items
            FROM seller_orders so
            JOIN orders o ON o.id = so.order_id
            JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON oi.seller_order_id = so.id
            LEFT JOIN product_variants pv ON pv.id = oi.variant_id
            LEFT JOIN products p ON p.id = pv.product_id
            WHERE so.seller_id = $1
            GROUP BY so.id, o.shipping_address, o.status, u.email, u.first_name, u.last_name
            ORDER BY so.created_at DESC
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching seller orders:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update fulfillment tracking for a seller order
export const updateOrderFulfillment = async (req, res) => {
    const { id } = req.params; // seller_order id
    const { status, trackingNumber, shippingCarrier } = req.body;
    const userId = req.user.id;

    try {
        // Verify ownership
        const orderCheck = await pool.query(
            'SELECT * FROM seller_orders WHERE id = $1 AND seller_id = $2',
            [id, userId]
        );

        if (orderCheck.rows.length === 0 && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Not authorized to fulfill this order' });
        }

        const validStatuses = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        let shippedAt = null;
        let deliveredAt = null;
        if (status === 'shipped') shippedAt = new Date();
        if (status === 'delivered') deliveredAt = new Date();

        const updated = await pool.query(
            `UPDATE seller_orders
             SET status = COALESCE($1, status),
                 tracking_number = COALESCE($2, tracking_number),
                 shipping_carrier = COALESCE($3, shipping_carrier),
                 shipped_at = COALESCE($4, shipped_at),
                 delivered_at = COALESCE($5, delivered_at)
             WHERE id = $6
             RETURNING *`,
            [status, trackingNumber, shippingCarrier, shippedAt, deliveredAt, id]
        );

        // Update corresponding order items fulfillment status
        if (status) {
            await pool.query(
                'UPDATE order_items SET fulfillment_status = $1 WHERE seller_order_id = $2',
                [status, id]
            );
        }

        await logAuditEvent({
            userId,
            action: 'ORDER_FULFILLMENT_UPDATED',
            targetEntity: 'seller_orders',
            targetId: Number(id),
            details: { status, trackingNumber, shippingCarrier }
        });

        res.json({ message: 'Fulfillment updated successfully', order: updated.rows[0] });
    } catch (err) {
        console.error('Error updating fulfillment:', err.message);
        res.status(500).json({ error: 'Server error updating fulfillment' });
    }
};

// Seller Payout History & Balance
export const getSellerPayouts = async (req, res) => {
    try {
        const userId = req.user.id;

        const [payoutsRes, earningsRes] = await Promise.all([
            pool.query('SELECT * FROM seller_payouts WHERE seller_id = $1 ORDER BY created_at DESC', [userId]),
            pool.query(`
                SELECT 
                    COALESCE(SUM(seller_net_earnings), 0)::numeric(10,2) AS lifetime_earnings,
                    COALESCE(SUM(seller_net_earnings) FILTER (WHERE status = 'delivered'), 0)::numeric(10,2) AS eligible_earnings
                FROM seller_orders
                WHERE seller_id = $1
            `, [userId])
        ]);

        const paidOutRes = await pool.query(
            "SELECT COALESCE(SUM(amount), 0)::numeric(10,2) AS total_paid FROM seller_payouts WHERE seller_id = $1 AND status = 'completed'",
            [userId]
        );

        const eligibleEarnings = Number(earningsRes.rows[0]?.eligible_earnings || 0);
        const totalPaid = Number(paidOutRes.rows[0]?.total_paid || 0);
        const availableBalance = Math.max(0, eligibleEarnings - totalPaid);

        res.json({
            payouts: payoutsRes.rows,
            lifetimeEarnings: Number(earningsRes.rows[0]?.lifetime_earnings || 0),
            eligibleEarnings,
            totalPaid,
            availableBalance
        });
    } catch (err) {
        console.error('Error fetching payouts:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Seller Requests a Payout
export const requestPayout = async (req, res) => {
    const { amount, notes } = req.body;
    const userId = req.user.id;
    const storeId = req.sellerStore?.id;
    const reqAmount = Number(amount);

    if (!Number.isFinite(reqAmount) || reqAmount < 100) {
        return res.status(400).json({ error: 'Minimum payout withdrawal is ₹100' });
    }

    try {
        const newPayout = await pool.query(
            `INSERT INTO seller_payouts (seller_id, store_id, amount, status, notes)
             VALUES ($1, $2, $3, 'pending', $4)
             RETURNING *`,
            [userId, storeId || null, reqAmount, notes || 'Requested by seller']
        );

        await logAuditEvent({
            userId,
            action: 'PAYOUT_REQUESTED',
            targetEntity: 'seller_payouts',
            targetId: newPayout.rows[0].id,
            details: { amount: reqAmount }
        });

        res.status(201).json({ message: 'Payout requested successfully', payout: newPayout.rows[0] });
    } catch (err) {
        console.error('Error requesting payout:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Public Store Details & Catalog by Slug
export const getPublicStoreBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const storeRes = await pool.query(
            `SELECT s.*, 
                    (SELECT COUNT(*)::int FROM products p WHERE p.store_id = s.id AND p.status = 'approved') AS product_count
             FROM seller_stores s
             WHERE s.slug = $1 AND s.is_active = true`,
            [slug]
        );

        if (storeRes.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        const store = storeRes.rows[0];

        // Fetch approved products for this store
        const productsRes = await pool.query(`
            SELECT p.*, c.name AS category_name,
                   (SELECT v.image_urls[1] FROM product_variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS main_image
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.store_id = $1 AND p.status = 'approved'
            ORDER BY p.created_at DESC
        `, [store.id]);

        res.json({
            store,
            products: productsRes.rows
        });
    } catch (err) {
        console.error('Error fetching public store:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Public list of active stores
export const getAllStores = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.id, s.name, s.slug, s.logo_url, s.banner_url, s.bio, s.is_featured,
                   COUNT(p.id)::int AS product_count
            FROM seller_stores s
            LEFT JOIN products p ON p.store_id = s.id AND p.status = 'approved'
            WHERE s.is_active = true
            GROUP BY s.id
            ORDER BY s.is_featured DESC, product_count DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching stores:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};
