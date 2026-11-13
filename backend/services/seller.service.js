import pool from '../db.js';
import { ApiError } from '../middleware/error.middleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const applySellerService = async (userId, { businessName, businessEmail, phone, taxId, documentUrls }) => {
    if (!businessName || !businessEmail) {
        throw new ApiError(400, 'Business name and email are required.');
    }

    const existingApp = await pool.query(
        'SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
    );

    if (existingApp.rows.length > 0 && existingApp.rows[0].status === 'pending') {
        throw new ApiError(400, 'You already have an active application pending review.');
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

    return appRes.rows[0];
};

export const getApplicationStatusService = async (user) => {
    const appRes = await pool.query(
        'SELECT * FROM seller_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id]
    );

    const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1', [user.id]);

    return {
        application: appRes.rows[0] || null,
        store: storeRes.rows[0] || null,
        isSeller: user.role === 'seller' || user.role === 'admin' || user.role === 'super_admin'
    };
};

export const getMyStoreService = async (user) => {
    const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1', [user.id]);
    if (storeRes.rows.length === 0) {
        const brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [user.id]);
        if (brandRes.rows.length > 0) {
            return brandRes.rows[0];
        }
        return {
            name: user?.first_name ? `${user.first_name}'s Atelier` : 'Brand Atelier',
            status: 'active',
            bio: 'Independent Fashion Label'
        };
    }
    return storeRes.rows[0];
};

export const updateMyStoreService = async (user, body) => {
    const { name, bio, logoUrl, bannerUrl, policyReturn, policyShipping } = body || {};

    let updated = await pool.query(
        `UPDATE seller_stores
         SET name = COALESCE($1, name),
             bio = COALESCE($2, bio),
             logo_url = COALESCE($3, logo_url),
             banner_url = COALESCE($4, banner_url),
             policy_return = COALESCE($5, policy_return),
             policy_shipping = COALESCE($6, policy_shipping)
         WHERE user_id = $7
         RETURNING *`,
        [name, bio, logoUrl, bannerUrl, policyReturn, policyShipping, user.id]
    );

    if (updated.rows.length === 0) {
        const brandUpdate = await pool.query(
            `UPDATE brands
             SET name = COALESCE($1, name),
                 bio = COALESCE($2, bio),
                 logo_url = COALESCE($3, logo_url),
                 banner_url = COALESCE($4, banner_url),
                 policy_return = COALESCE($5, policy_return),
                 policy_shipping = COALESCE($6, policy_shipping)
             WHERE user_id = $7
             RETURNING *`,
            [name, bio, logoUrl, bannerUrl, policyReturn, policyShipping, user.id]
        );
        if (brandUpdate.rows.length > 0) {
            return brandUpdate.rows[0];
        }
    }

    return updated.rows[0] || {};
};

export const getSellerOverviewService = async (storeId, userId) => {
    const ordersRes = await pool.query(
        `SELECT 
            COUNT(DISTINCT so.id) AS total_orders,
            COALESCE(SUM(so.subtotal), 0) AS gross_sales,
            COALESCE(SUM(so.commission_amount), 0) AS commission_paid,
            COALESCE(SUM(so.seller_net_earnings), 0) AS net_earnings
         FROM seller_orders so
         WHERE (so.store_id = $1 OR so.seller_id = $2)`,
        [storeId, userId]
    );

    const pendingOrdersRes = await pool.query(
        `SELECT COUNT(*) AS count
         FROM seller_orders
         WHERE (store_id = $1 OR seller_id = $2)
           AND status IN ('unfulfilled', 'pending')`,
        [storeId, userId]
    );

    const productsRes = await pool.query(
        `SELECT 
            COUNT(*) AS total_products,
            COUNT(*) FILTER (WHERE status = 'approved') AS active_products,
            COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review_products
         FROM products
         WHERE (store_id = $1 OR seller_id = $2)`,
        [storeId, userId]
    );

    const lowStockRes = await pool.query(
        `SELECT pv.id, pv.sku, pv.size, pv.color, pv.stock_quantity, pv.low_stock_threshold,
                p.name AS product_name, p.id AS product_id
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         WHERE (p.store_id = $1 OR p.seller_id = $2)
           AND pv.stock_quantity <= pv.low_stock_threshold
         ORDER BY pv.stock_quantity ASC
         LIMIT 5`,
        [storeId, userId]
    );

    return {
        orders: ordersRes.rows[0],
        pendingShipments: parseInt(pendingOrdersRes.rows[0]?.count || 0, 10),
        products: productsRes.rows[0],
        lowStockItems: lowStockRes.rows
    };
};

export const getSellerProductsService = async (storeId, userId) => {
    const result = await pool.query(
        `SELECT p.*, c.name AS category_name,
                COUNT(pv.id) AS variant_count,
                COALESCE(SUM(pv.stock_quantity), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON p.id = pv.product_id
         WHERE (p.store_id = $1 OR p.seller_id = $2)
         GROUP BY p.id, c.name
         ORDER BY p.created_at DESC`,
        [storeId, userId]
    );

    return Promise.all(
        result.rows.map(async (prod) => {
            const variantsRes = await pool.query(
                `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
                [prod.id]
            );
            return {
                ...prod,
                variants: variantsRes.rows
            };
        })
    );
};

export const getSellerOrdersService = async (storeId, userId) => {
    const ordersRes = await pool.query(
        `SELECT so.*, o.created_at AS order_date, o.shipping_address, o.user_id AS buyer_id,
                u.first_name AS buyer_first_name, u.last_name AS buyer_last_name, u.email AS buyer_email
         FROM seller_orders so
         JOIN orders o ON so.order_id = o.id
         JOIN users u ON o.user_id = u.id
         WHERE (so.store_id = $1 OR so.seller_id = $2)
         ORDER BY so.created_at DESC`,
        [storeId, userId]
    );

    return Promise.all(
        ordersRes.rows.map(async (so) => {
            const itemsRes = await pool.query(
                `SELECT oi.*, p.name AS product_name, pv.size, pv.color, pv.sku
                 FROM order_items oi
                 JOIN product_variants pv ON oi.variant_id = pv.id
                 JOIN products p ON pv.product_id = p.id
                 WHERE oi.seller_order_id = $1`,
                [so.id]
            );
            return {
                ...so,
                items: itemsRes.rows
            };
        })
    );
};

export const updateSellerOrderFulfillmentService = async (user, storeId, sellerOrderId, body) => {
    const { status, tracking_number, shipping_carrier } = body;
    const validStatuses = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid fulfillment status');
    }

    const currentRes = await pool.query(
        `SELECT * FROM seller_orders WHERE id = $1 AND (store_id = $2 OR seller_id = $3)`,
        [sellerOrderId, storeId, user.id]
    );

    if (currentRes.rows.length === 0) {
        throw new ApiError(404, 'Fulfillment order not found or not owned by seller');
    }

    const updated = await pool.query(
        `UPDATE seller_orders SET
            status = COALESCE($1, status),
            fulfillment_status = COALESCE($1, fulfillment_status),
            tracking_number = COALESCE($2, tracking_number),
            shipping_carrier = COALESCE($3, shipping_carrier),
            carrier = COALESCE($3, carrier),
            shipped_at = CASE WHEN $1 = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
            delivered_at = CASE WHEN $1 = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
            updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, tracking_number, shipping_carrier, sellerOrderId]
    );

    if (status) {
        await pool.query(
            `UPDATE order_items SET fulfillment_status = $1 WHERE seller_order_id = $2`,
            [status, sellerOrderId]
        );

        const parentOrderId = updated.rows[0].order_id;
        const allSubOrders = await pool.query('SELECT status, fulfillment_status FROM seller_orders WHERE order_id = $1', [parentOrderId]);
        const statuses = allSubOrders.rows.map(r => (r.fulfillment_status || r.status || '').toLowerCase());

        let parentStatus = 'processing';
        if (statuses.every(s => s === 'delivered')) parentStatus = 'delivered';
        else if (statuses.every(s => s === 'shipped' || s === 'delivered')) parentStatus = 'shipped';
        else if (statuses.every(s => s === 'cancelled')) parentStatus = 'cancelled';

        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [parentStatus, parentOrderId]);
    }

    await logAuditEvent({
        userId: user.id,
        action: 'ORDER_FULFILLMENT_UPDATED',
        targetEntity: 'seller_orders',
        targetId: Number(sellerOrderId),
        details: { status, tracking_number, shipping_carrier }
    });

    return updated.rows[0];
};

export const getSellerPayoutsService = async (storeId, userId) => {
    const payoutsRes = await pool.query(
        `SELECT * FROM seller_payouts WHERE seller_id = $1 OR store_id = $2 ORDER BY created_at DESC`,
        [userId, storeId]
    );

    const availableRes = await pool.query(
        `SELECT 
            COALESCE(SUM(seller_net_earnings), 0) AS total_earned
         FROM seller_orders
         WHERE (store_id = $1 OR seller_id = $2) AND status = 'delivered'`,
        [storeId, userId]
    );

    const paidRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_paid
         FROM seller_payouts
         WHERE (store_id = $1 OR seller_id = $2) AND status = 'completed'`,
        [storeId, userId]
    );

    const pendingRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_pending
         FROM seller_payouts
         WHERE (store_id = $1 OR seller_id = $2) AND status = 'pending'`,
        [storeId, userId]
    );

    const totalEarned = Number(availableRes.rows[0].total_earned);
    const totalPaid = Number(paidRes.rows[0].total_paid);
    const totalPending = Number(pendingRes.rows[0].total_pending);
    const availableBalance = Math.max(0, totalEarned - totalPaid - totalPending);

    return {
        availableBalance,
        totalEarned,
        totalPaid,
        totalPending,
        payouts: payoutsRes.rows
    };
};

export const requestPayoutService = async (user, storeId, body) => {
    const amount = Number(body.amount);
    const payoutMethod = body.payoutMethod || 'bank_transfer';
    const notes = body.notes || null;

    if (!amount || amount <= 0) {
        throw new ApiError(400, 'Invalid payout amount requested');
    }

    const availableRes = await pool.query(
        `SELECT COALESCE(SUM(seller_net_earnings), 0) AS total_earned
         FROM seller_orders
         WHERE (store_id = $1 OR seller_id = $2) AND status = 'delivered'`,
        [storeId, user.id]
    );

    const paidRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_paid
         FROM seller_payouts
         WHERE (store_id = $1 OR seller_id = $2) AND status IN ('completed', 'pending')`,
        [storeId, user.id]
    );

    const available = Number(availableRes.rows[0].total_earned) - Number(paidRes.rows[0].total_paid);

    if (amount > available) {
        throw new ApiError(400, `Requested amount ₹${amount} exceeds available balance of ₹${available}`);
    }

    const payoutRes = await pool.query(
        `INSERT INTO seller_payouts (seller_id, store_id, amount, payout_method, notes, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [user.id, storeId, amount, payoutMethod, notes]
    );

    await logAuditEvent({
        userId: user.id,
        action: 'PAYOUT_REQUESTED',
        targetEntity: 'seller_payouts',
        targetId: payoutRes.rows[0].id,
        details: { amount, payoutMethod }
    });

    return payoutRes.rows[0];
};

export const getAllStoresService = async () => {
    const result = await pool.query(`
        SELECT s.id, s.name, s.slug, s.logo_url, s.banner_url, s.bio, s.is_featured, s.created_at,
               COUNT(p.id) AS product_count
        FROM seller_stores s
        LEFT JOIN products p ON s.id = p.store_id AND p.status = 'approved'
        WHERE s.is_active = true
        GROUP BY s.id
        ORDER BY s.is_featured DESC, s.name ASC
    `);
    return result.rows;
};

export const getPublicStoreBySlugService = async (slug) => {
    const storeResult = await pool.query('SELECT * FROM seller_stores WHERE slug = $1 AND is_active = true', [slug]);
    if (storeResult.rows.length === 0) {
        throw new ApiError(404, 'Store not found');
    }

    const store = storeResult.rows[0];
    const productsResult = await pool.query(
        `SELECT p.*,
                (SELECT v.image_urls[1] FROM product_variants v WHERE v.product_id = p.id ORDER BY v.id ASC LIMIT 1) AS main_image
         FROM products p
         WHERE p.store_id = $1 AND p.status = 'approved'
         ORDER BY p.created_at DESC`,
        [store.id]
    );

    return {
        store,
        products: productsResult.rows
    };
};
