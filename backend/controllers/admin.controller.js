import pool from '../db.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Comprehensive Marketplace Overview
export const getAdminOverview = async (req, res) => {
    try {
        const [
            productsRes,
            pendingProductsRes,
            ordersRes,
            usersRes,
            activeSellersRes,
            pendingAppsRes,
            financialsRes,
            pendingPayoutsRes
        ] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM products WHERE status = 'approved'"),
            pool.query("SELECT COUNT(*)::int AS count FROM products WHERE status = 'pending_approval'"),
            pool.query("SELECT COUNT(*)::int AS count FROM orders"),
            pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user' OR role = 'customer'"),
            pool.query("SELECT COUNT(*)::int AS count FROM seller_stores WHERE is_active = true"),
            pool.query("SELECT COUNT(*)::int AS count FROM seller_applications WHERE status = 'pending'"),
            pool.query(`
                SELECT 
                    COALESCE(SUM(total_amount), 0)::numeric(12,2) AS total_gmv,
                    COALESCE(SUM(commission_amount), 0)::numeric(12,2) AS platform_revenue
                FROM (
                    SELECT total_amount, (SELECT COALESCE(SUM(commission_amount), 0) FROM seller_orders WHERE order_id = orders.id) AS commission_amount
                    FROM orders
                ) o
            `),
            pool.query("SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS count FROM seller_payouts WHERE status = 'pending'")
        ]);

        res.json({
            gmv: Number(financialsRes.rows[0]?.total_gmv || 0),
            platformRevenue: Number(financialsRes.rows[0]?.platform_revenue || 0),
            products: productsRes.rows[0]?.count || 0,
            pendingProducts: pendingProductsRes.rows[0]?.count || 0,
            orders: ordersRes.rows[0]?.count || 0,
            users: usersRes.rows[0]?.count || 0,
            activeSellers: activeSellersRes.rows[0]?.count || 0,
            pendingApplications: pendingAppsRes.rows[0]?.count || 0,
            pendingPayouts: Number(pendingPayoutsRes.rows[0]?.count || 0)
        });
    } catch (err) {
        console.error('Error fetching admin overview:', err.message);
        res.status(500).json({ error: 'Server error fetching admin overview' });
    }
};

// All Marketplace Products (with Seller & Moderation info)
export const getAdminProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name AS category_name,
                   s.name AS store_name, s.slug AS store_slug,
                   u.email AS seller_email,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS seller_name,
                   COALESCE(
                       json_agg(json_build_object(
                           'id', pv.id,
                           'sku', pv.sku,
                           'size', pv.size,
                           'color', pv.color,
                           'stock_quantity', pv.stock_quantity,
                           'price_override', pv.price_override,
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
            LEFT JOIN seller_stores s ON s.id = p.store_id
            LEFT JOIN users u ON u.id = p.seller_id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            GROUP BY p.id, c.name, s.name, s.slug, u.email, u.first_name, u.last_name
            ORDER BY p.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin products:', err.message);
        res.status(500).json({ error: 'Server error fetching products' });
    }
};

// Moderate a Product (Approve / Reject / Archive)
export const moderateProduct = async (req, res) => {
    const { id } = req.params;
    const { status, moderationNote } = req.body;

    const validStatuses = ['approved', 'rejected', 'pending_approval', 'archived', 'draft'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const updated = await pool.query(
            `UPDATE products
             SET status = $1,
                 moderation_note = COALESCE($2, moderation_note)
             WHERE id = $3
             RETURNING *`,
            [status, moderationNote || null, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'PRODUCT_MODERATED',
            targetEntity: 'products',
            targetId: Number(id),
            details: { status, moderationNote }
        });

        res.json({ message: `Product listing marked as ${status}`, product: updated.rows[0] });
    } catch (err) {
        console.error('Error moderating product:', err.message);
        res.status(500).json({ error: 'Server error moderating product' });
    }
};

// Admin Orders with Seller Sub-Orders
export const getAdminOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.id, o.total_amount, o.status, o.shipping_address, o.razorpay_payment_id, o.created_at,
                   u.id AS user_id, u.first_name, u.last_name, u.email,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS user_name,
                   COALESCE(
                       json_agg(json_build_object(
                           'product_name', p.name,
                           'variant_id', pv.id,
                           'sku', pv.sku,
                           'size', pv.size,
                           'color', pv.color,
                           'quantity', oi.quantity,
                           'price_at_purchase', oi.price_at_purchase,
                           'seller_id', oi.seller_id,
                           'seller_order_id', oi.seller_order_id,
                           'fulfillment_status', oi.fulfillment_status,
                           'store_name', s.name,
                           'image_urls', pv.image_urls
                       )) FILTER (WHERE oi.id IS NOT NULL),
                       '[]'::json
                   ) AS items
            FROM orders o
            JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN product_variants pv ON pv.id = oi.variant_id
            LEFT JOIN products p ON p.id = pv.product_id
            LEFT JOIN seller_stores s ON s.user_id = oi.seller_id
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};

// Seller Applications Management
export const getSellerApplications = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sa.*, u.email AS user_email,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS user_name
            FROM seller_applications sa
            JOIN users u ON u.id = sa.user_id
            ORDER BY sa.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching seller applications:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Review Seller Application (Approve / Reject)
export const reviewSellerApplication = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be either 'approved' or 'rejected'" });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const appRes = await client.query('SELECT * FROM seller_applications WHERE id = $1 FOR UPDATE', [id]);
        if (appRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Application not found' });
        }

        const application = appRes.rows[0];

        // Update application
        const updatedApp = await client.query(
            `UPDATE seller_applications
             SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, adminNotes || null, req.user.id, id]
        );

        if (status === 'approved') {
            // 1. Upgrade user role to 'seller'
            await client.query("UPDATE users SET role = 'seller' WHERE id = $1", [application.user_id]);

            // 2. Generate slug and create store if not exists
            const baseSlug = application.business_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const slug = `${baseSlug}-${application.user_id}`;

            await client.query(
                `INSERT INTO seller_stores (user_id, name, slug, bio, is_active)
                 VALUES ($1, $2, $3, $4, true)
                 ON CONFLICT (user_id) DO UPDATE SET is_active = true`,
                [application.user_id, application.business_name, slug, `Official store of ${application.business_name}`]
            );
        }

        await logAuditEvent({
            userId: req.user.id,
            action: `SELLER_APPLICATION_${status.toUpperCase()}`,
            targetEntity: 'seller_applications',
            targetId: Number(id),
            details: { targetUserId: application.user_id, adminNotes }
        });

        await client.query('COMMIT');
        res.json({ message: `Application ${status} successfully`, application: updatedApp.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error reviewing seller application:', err.message);
        res.status(500).json({ error: 'Server error processing review' });
    } finally {
        client.release();
    }
};

// Seller Stores Management (List, Suspend, Reactivate)
export const getAdminSellers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, u.email, u.role,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS owner_name,
                   (SELECT COUNT(*)::int FROM products p WHERE p.store_id = s.id) AS total_products,
                   (SELECT COUNT(*)::int FROM seller_orders so WHERE so.store_id = s.id) AS total_orders,
                   (SELECT COALESCE(SUM(so.seller_net_earnings), 0)::numeric(12,2) FROM seller_orders so WHERE so.store_id = s.id) AS total_sales
            FROM seller_stores s
            JOIN users u ON u.id = s.user_id
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin sellers:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateSellerStatus = async (req, res) => {
    const { id } = req.params; // store id
    const { isActive, commissionRate } = req.body;

    try {
        const updated = await pool.query(
            `UPDATE seller_stores
             SET is_active = COALESCE($1, is_active),
                 commission_rate = COALESCE($2, commission_rate)
             WHERE id = $3
             RETURNING *`,
            [isActive, commissionRate ? Number(commissionRate) : null, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'SELLER_STORE_UPDATED',
            targetEntity: 'seller_stores',
            targetId: Number(id),
            details: { isActive, commissionRate }
        });

        res.json({ message: 'Seller status updated', store: updated.rows[0] });
    } catch (err) {
        console.error('Error updating seller status:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Commission Rules Management
export const getCommissionRules = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cr.*, 
                   CASE 
                       WHEN cr.rule_type = 'seller' THEN (SELECT name FROM seller_stores WHERE user_id = cr.target_id)
                       WHEN cr.rule_type = 'category' THEN (SELECT name FROM categories WHERE id = cr.target_id)
                       ELSE 'Platform Default'
                   END AS target_name
            FROM commission_rules cr
            ORDER BY cr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching commission rules:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createOrUpdateCommissionRule = async (req, res) => {
    const { ruleType, targetId, rate } = req.body;
    const numRate = Number(rate);

    if (!ruleType || !Number.isFinite(numRate) || numRate < 0 || numRate > 100) {
        return res.status(400).json({ error: 'Valid rule type and rate (0-100) are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO commission_rules (rule_type, target_id, rate, is_active)
             VALUES ($1, $2, $3, true)
             RETURNING *`,
            [ruleType, targetId || null, numRate]
        );

        await logAuditEvent({
            userId: req.user.id,
            action: 'COMMISSION_RULE_CREATED',
            targetEntity: 'commission_rules',
            targetId: result.rows[0].id,
            details: { ruleType, targetId, rate: numRate }
        });

        res.status(201).json({ message: 'Commission rule saved', rule: result.rows[0] });
    } catch (err) {
        console.error('Error saving commission rule:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Payouts Oversight
export const getAdminPayouts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sp.*, s.name AS store_name, u.email AS seller_email,
                   COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS seller_name
            FROM seller_payouts sp
            LEFT JOIN seller_stores s ON s.id = sp.store_id
            JOIN users u ON u.id = sp.seller_id
            ORDER BY sp.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching payouts:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updatePayoutStatus = async (req, res) => {
    const { id } = req.params;
    const { status, referenceId, notes } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const updated = await pool.query(
            `UPDATE seller_payouts
             SET status = $1,
                 reference_id = COALESCE($2, reference_id),
                 notes = COALESCE($3, notes),
                 processed_by = $4,
                 processed_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [status, referenceId || null, notes || null, req.user.id, id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Payout record not found' });
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'PAYOUT_STATUS_UPDATED',
            targetEntity: 'seller_payouts',
            targetId: Number(id),
            details: { status, referenceId }
        });

        res.json({ message: `Payout marked as ${status}`, payout: updated.rows[0] });
    } catch (err) {
        console.error('Error updating payout:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Returns & Disputes
export const getAdminReturns = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.*, o.total_amount AS order_total,
                   p.name AS product_name, pv.size, pv.color,
                   u.email AS customer_email,
                   s.name AS store_name
            FROM return_requests rr
            JOIN orders o ON o.id = rr.order_id
            JOIN order_items oi ON oi.id = rr.order_item_id
            JOIN product_variants pv ON pv.id = oi.variant_id
            JOIN products p ON p.id = pv.product_id
            JOIN users u ON u.id = rr.user_id
            LEFT JOIN seller_stores s ON s.user_id = rr.seller_id
            ORDER BY rr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin returns:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateReturnStatus = async (req, res) => {
    const { id } = req.params;
    const { status, restockInventory, adminNotes } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid return status' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const returnRes = await client.query('SELECT * FROM return_requests WHERE id = $1 FOR UPDATE', [id]);
        if (returnRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Return request not found' });
        }

        const returnReq = returnRes.rows[0];

        const updated = await client.query(
            `UPDATE return_requests
             SET status = $1,
                 restock_inventory = COALESCE($2, restock_inventory),
                 admin_notes = COALESCE($3, admin_notes)
             WHERE id = $4
             RETURNING *`,
            [status, restockInventory, adminNotes, id]
        );

        // If approved and restock is explicitly requested, restock inventory
        if (status === 'completed' && restockInventory) {
            const itemRes = await client.query('SELECT variant_id, quantity FROM order_items WHERE id = $1', [returnReq.order_item_id]);
            if (itemRes.rows.length > 0) {
                await client.query(
                    'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                    [itemRes.rows[0].quantity, itemRes.rows[0].variant_id]
                );
            }
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'RETURN_STATUS_UPDATED',
            targetEntity: 'return_requests',
            targetId: Number(id),
            details: { status, restockInventory }
        });

        await client.query('COMMIT');
        res.json({ message: `Return request ${status}`, returnRequest: updated.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating return request:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

// Security Audit Logs
export const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT al.*, u.email AS user_email, u.role AS user_role
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching audit logs:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Platform Buyers Management
export const getBuyers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.role = 'user' OR u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching buyers:', err);
        res.status(500).json({ error: 'Server error fetching buyers' });
    }
};

// Brand Sellers Directory & Moderation for Super Admin
export const getBrandSellers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, u.email as owner_email, u.first_name, u.last_name, u.phone as owner_phone,
                   COUNT(DISTINCT p.id) as total_products,
                   COUNT(DISTINCT so.id) as total_orders,
                   COALESCE(SUM(so.subtotal), 0) as gross_volume,
                   COALESCE(SUM(so.commission_amount), 0) as platform_commission,
                   COALESCE(SUM(so.seller_net_earnings), 0) as net_payout
            FROM brands b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN products p ON b.id = p.brand_id
            LEFT JOIN seller_orders so ON b.id = so.brand_id
            GROUP BY b.id, u.email, u.first_name, u.last_name, u.phone
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching brand sellers:', err);
        res.status(500).json({ error: 'Server error fetching brands' });
    }
};

// Super Admin Update Brand Status (Approve / Suspend / Reactivate / Commission)
export const updateBrandStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, commission_rate } = req.body;
        const validStatuses = ['active', 'suspended', 'rejected', 'pending'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid brand status' });
        }

        const result = await pool.query(`
            UPDATE brands SET
                status = COALESCE($1, status),
                commission_rate = COALESCE($2, commission_rate),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [status, commission_rate, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        if (status) {
            await pool.query(
                `UPDATE seller_stores SET is_active = $1 WHERE id = $2`,
                [status === 'active', id]
            );
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'SUPER_ADMIN_BRAND_STATUS_CHANGED',
            targetType: 'brand',
            targetId: id,
            details: { status, commission_rate }
        });

        res.json({ message: 'Brand status updated successfully', brand: result.rows[0] });
    } catch (err) {
        console.error('Error updating brand status:', err);
        res.status(500).json({ error: 'Server error updating brand status' });
    }
};
