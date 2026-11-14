import pool from '../db.js';
import { ApiError } from '../middleware/error.middleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getAdminOverviewService = async () => {
    const [
        productsRes,
        pendingProductsRes,
        ordersRes,
        usersRes,
        activeSellersRes,
        pendingAppsRes,
        financialsRes,
        pendingPayoutsRes,
        brandDistRes,
        categoryRes,
        recentOrdersRes
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
        pool.query("SELECT COALESCE(SUM(amount), 0)::numeric(12,2) AS count FROM seller_payouts WHERE status = 'pending'"),
        pool.query(`
            SELECT b.name AS brand_name,
                   COUNT(so.id)::int AS orders_count,
                   COALESCE(SUM(so.subtotal), 0)::numeric(12,2) AS gross_sales,
                   COALESCE(SUM(so.commission_amount), 0)::numeric(12,2) AS platform_commission
            FROM brands b
            LEFT JOIN seller_orders so ON so.brand_id = b.id
            GROUP BY b.id, b.name
            ORDER BY gross_sales DESC
        `),
        pool.query(`
            SELECT COALESCE(c.name, 'Apparel') AS category_name,
                   COUNT(oi.id)::int AS units_sold,
                   COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)::numeric(12,2) AS revenue
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            GROUP BY c.name
            ORDER BY revenue DESC
        `),
        pool.query(`
            SELECT o.total_amount, o.created_at,
                   (SELECT COALESCE(SUM(so.commission_amount), 0) FROM seller_orders so WHERE so.order_id = o.id) AS commission_amount
            FROM orders o
            WHERE o.created_at >= NOW() - INTERVAL '14 days'
        `)
    ]);

    const totalGmv = Number(financialsRes.rows[0]?.total_gmv || 0);

    const chartMap = new Map();
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        chartMap.set(dateStr, { date: dateStr, label, gmv: 0, commission: 0, orders: 0 });
    }

    recentOrdersRes.rows.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().slice(0, 10);
        if (chartMap.has(dateStr)) {
            const entry = chartMap.get(dateStr);
            const amt = Number(o.total_amount || 0);
            const comm = o.commission_amount != null && Number(o.commission_amount) > 0 
                ? Number(o.commission_amount) 
                : Number((amt * 0.05).toFixed(2));
            entry.gmv += amt;
            entry.commission += Number(comm.toFixed(2));
            entry.orders += 1;
        }
    });

    const brandDistribution = brandDistRes.rows.map(b => ({
        ...b,
        share: totalGmv > 0 ? Number(((Number(b.gross_sales) / totalGmv) * 100).toFixed(1)) : 0
    }));

    const categoryBreakdown = categoryRes.rows.map(c => ({
        ...c,
        share: totalGmv > 0 ? Number(((Number(c.revenue) / totalGmv) * 100).toFixed(1)) : 0
    }));

    return {
        gmv: totalGmv,
        platformRevenue: Number(financialsRes.rows[0]?.platform_revenue || 0),
        products: productsRes.rows[0]?.count || 0,
        pendingProducts: pendingProductsRes.rows[0]?.count || 0,
        orders: ordersRes.rows[0]?.count || 0,
        users: usersRes.rows[0]?.count || 0,
        activeSellers: activeSellersRes.rows[0]?.count || 0,
        pendingApplications: pendingAppsRes.rows[0]?.count || 0,
        pendingPayouts: Number(pendingPayoutsRes.rows[0]?.count || 0),
        chartData: Array.from(chartMap.values()),
        brandDistribution,
        categoryBreakdown
    };
};

export const getAdminProductsService = async () => {
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
    return result.rows;
};

export const moderateProductService = async (adminUser, productId, { status, rejectionReason, moderationNote }) => {
    const validStatuses = ['approved', 'rejected', 'pending_approval'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status');
    }

    const note = rejectionReason || moderationNote || null;

    const result = await pool.query(
        `UPDATE products
         SET status = $1, rejection_reason = $2, moderation_note = $2
         WHERE id = $3
         RETURNING *`,
        [status, note, productId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Product not found');
    }

    await logAuditEvent({
        userId: adminUser.id,
        action: 'PRODUCT_MODERATED',
        targetEntity: 'products',
        targetId: Number(productId),
        details: { status, rejectionReason: note, moderationNote: note }
    });

    return result.rows[0];
};

export const getAdminOrdersService = async () => {
    const result = await pool.query(`
        SELECT o.*, u.email AS buyer_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS buyer_name,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS total_items,
               (SELECT COUNT(DISTINCT seller_id) FROM seller_orders WHERE order_id = o.id) AS total_sellers,
               (SELECT json_agg(json_build_object(
                   'seller_id', so.seller_id,
                   'store_id', so.store_id,
                   'subtotal', so.subtotal,
                   'commission_amount', so.commission_amount,
                   'seller_net_earnings', so.seller_net_earnings,
                   'status', so.status,
                   'tracking_number', so.tracking_number,
                   'shipping_carrier', so.shipping_carrier
               )) FROM seller_orders so WHERE so.order_id = o.id) AS fulfillments
        FROM orders o
        JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
    `);
    return result.rows;
};

export const getSellerApplicationsService = async () => {
    const result = await pool.query(`
        SELECT sa.*, u.email AS applicant_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS applicant_name
        FROM seller_applications sa
        JOIN users u ON u.id = sa.user_id
        ORDER BY sa.created_at DESC
    `);
    return result.rows;
};

export const reviewSellerApplicationService = async (adminUser, applicationId, { status, adminNotes, storeSlug, commissionRate }) => {
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid status');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const appResult = await client.query('SELECT * FROM seller_applications WHERE id = $1', [applicationId]);
        if (appResult.rows.length === 0) {
            throw new ApiError(404, 'Application not found');
        }

        const app = appResult.rows[0];
        const updatedApp = await client.query(
            `UPDATE seller_applications
             SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, adminNotes || null, adminUser.id, applicationId]
        );

        if (status === 'approved') {
            await client.query("UPDATE users SET role = 'seller' WHERE id = $1", [app.user_id]);

            const baseSlug = storeSlug || app.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

            await client.query(
                `INSERT INTO seller_stores (user_id, name, slug, commission_rate, is_active)
                 VALUES ($1, $2, $3, 5.00, true)
                 ON CONFLICT (slug) DO UPDATE SET is_active = true`,
                [app.user_id, app.business_name, uniqueSlug]
            );

            await client.query(
                `INSERT INTO brands (user_id, name, slug, contact_email, contact_phone, status, commission_rate)
                 VALUES ($1, $2, $3, $4, $5, 'active', 5.00)
                 ON CONFLICT (slug) DO UPDATE SET status = 'active'`,
                [app.user_id, app.business_name, uniqueSlug, app.business_email, app.phone]
            );
        }

        await logAuditEvent({
            userId: adminUser.id,
            action: `SELLER_APPLICATION_${status.toUpperCase()}`,
            targetEntity: 'seller_applications',
            targetId: Number(applicationId),
            details: { status, adminNotes }
        });

        await client.query('COMMIT');
        return updatedApp.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const getAdminSellersService = async () => {
    const result = await pool.query(`
        SELECT s.*, u.email AS owner_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS owner_name,
               (SELECT COUNT(*) FROM products WHERE store_id = s.id) AS total_products,
               (SELECT COALESCE(SUM(subtotal), 0) FROM seller_orders WHERE store_id = s.id) AS total_sales,
               (SELECT COALESCE(SUM(commission_amount), 0) FROM seller_orders WHERE store_id = s.id) AS platform_commission_paid
        FROM seller_stores s
        JOIN users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
    `);
    return result.rows;
};

export const updateSellerStatusService = async (adminUser, sellerId, { isActive }) => {
    const result = await pool.query(
        `UPDATE seller_stores SET is_active = $1 WHERE id = $2 RETURNING *`,
        [Boolean(isActive), sellerId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Seller not found');
    }

    await logAuditEvent({
        userId: adminUser.id,
        action: 'SELLER_STATUS_UPDATED',
        targetEntity: 'seller_stores',
        targetId: Number(sellerId),
        details: { isActive }
    });

    return result.rows[0];
};

export const getCommissionRulesService = async () => {
    return {
        message: 'Platform commission is set to a static 5% take-rate for all sellers and brands.',
        default_rate: 5.00
    };
};

export const getAdminPayoutsService = async () => {
    const result = await pool.query(`
        SELECT sp.*, s.name AS store_name, u.email AS seller_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS seller_name
        FROM seller_payouts sp
        JOIN users u ON u.id = sp.seller_id
        LEFT JOIN seller_stores s ON s.id = sp.store_id
        ORDER BY sp.created_at DESC
    `);
    return result.rows;
};

export const updatePayoutStatusService = async (adminUser, payoutId, { status, referenceId, notes }) => {
    const validStatuses = ['completed', 'rejected', 'processing'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid payout status');
    }

    const result = await pool.query(
        `UPDATE seller_payouts
         SET status = $1, reference_id = COALESCE($2, reference_id), notes = COALESCE($3, notes),
             processed_by = $4, processed_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [status, referenceId || null, notes || null, adminUser.id, payoutId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, 'Payout not found');
    }

    await logAuditEvent({
        userId: adminUser.id,
        action: 'PAYOUT_STATUS_UPDATED',
        targetEntity: 'seller_payouts',
        targetId: Number(payoutId),
        details: { status, referenceId }
    });

    return result.rows[0];
};

export const getAdminReturnsService = async () => {
    const result = await pool.query(`
        SELECT rr.*, o.id AS order_id, u.email AS buyer_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS buyer_name,
               p.name AS product_name, pv.size, pv.color,
               s.name AS store_name
        FROM return_requests rr
        JOIN orders o ON o.id = rr.order_id
        JOIN users u ON u.id = rr.user_id
        JOIN order_items oi ON oi.id = rr.order_item_id
        JOIN product_variants pv ON pv.id = oi.variant_id
        JOIN products p ON p.id = pv.product_id
        LEFT JOIN seller_stores s ON s.id = rr.seller_id
        ORDER BY rr.created_at DESC
    `);
    return result.rows;
};

export const updateReturnStatusService = async (adminUser, returnId, { status, adminNotes }) => {
    const validStatuses = ['approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid return status');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const returnRes = await client.query('SELECT * FROM return_requests WHERE id = $1', [returnId]);
        if (returnRes.rows.length === 0) {
            throw new ApiError(404, 'Return request not found');
        }

        const returnReq = returnRes.rows[0];
        const result = await client.query(
            `UPDATE return_requests
             SET status = $1, admin_notes = $2, resolved_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, adminNotes || null, returnId]
        );

        if (status === 'completed' && returnReq.status !== 'completed') {
            const itemRes = await client.query('SELECT variant_id, quantity FROM order_items WHERE id = $1', [returnReq.order_item_id]);
            if (itemRes.rows.length > 0) {
                const { variant_id, quantity } = itemRes.rows[0];
                await client.query(
                    'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                    [quantity, variant_id]
                );
            }
        }

        await logAuditEvent({
            userId: adminUser.id,
            action: `RETURN_${status.toUpperCase()}`,
            targetEntity: 'return_requests',
            targetId: Number(returnId),
            details: { status, adminNotes }
        });

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const getAuditLogsService = async () => {
    const result = await pool.query(`
        SELECT a.*, u.email AS user_email,
               COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS user_name
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 100
    `);
    return result.rows;
};

export const getBuyersService = async () => {
    const result = await pool.query(`
        SELECT 
            u.id, u.email, u.first_name, u.last_name, u.role, u.is_blocked, u.phone, u.created_at,
            COUNT(DISTINCT o.id)::int AS total_orders,
            COALESCE(SUM(o.total_amount), 0)::numeric(12,2) AS lifetime_spend,
            MAX(o.created_at) AS last_order_date
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        WHERE u.role = 'user' OR u.role = 'customer'
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `);
    return result.rows;
};

export const getBrandSellersService = async () => {
    const result = await pool.query(`
        SELECT 
            b.*,
            u.email AS owner_email,
            COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS owner_name,
            u.is_blocked AS owner_blocked,
            COUNT(DISTINCT p.id)::int AS total_products,
            COALESCE(SUM(so.subtotal), 0)::numeric(12,2) AS gross_sales,
            COALESCE(SUM(so.commission_amount), 0)::numeric(12,2) AS platform_commission_paid,
            COALESCE(SUM(so.seller_net_earnings), 0)::numeric(12,2) AS net_earnings
        FROM brands b
        JOIN users u ON u.id = b.user_id
        LEFT JOIN products p ON (p.brand_id = b.id OR (p.brand_id IS NULL AND p.seller_id = b.user_id))
        LEFT JOIN seller_orders so ON (so.brand_id = b.id OR (so.brand_id IS NULL AND so.seller_id = b.user_id))
        GROUP BY b.id, u.id
        ORDER BY b.created_at DESC
    `);
    return result.rows;
};

export const updateBrandStatusService = async (adminUser, brandId, { status }) => {
    const validStatuses = ['active', 'suspended', 'rejected', 'pending'];
    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid brand status');
    }

    const currentBrandRes = await pool.query('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (currentBrandRes.rows.length === 0) {
        throw new ApiError(404, 'Brand not found');
    }

    if (status) {
        await pool.query('UPDATE brands SET status = $1, updated_at = NOW() WHERE id = $2', [status, brandId]);
        await pool.query('UPDATE seller_stores SET is_active = $1 WHERE id = $2', [status === 'active', brandId]);

        await logAuditEvent({
            userId: adminUser.id,
            action: 'SUPER_ADMIN_BRAND_STATUS_CHANGED',
            targetType: 'brand',
            targetId: Number(brandId),
            details: { status }
        });
    }

    const updatedBrand = await pool.query('SELECT * FROM brands WHERE id = $1', [brandId]);
    return updatedBrand.rows[0];
};

export const deleteBrandService = async (adminUser, brandId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const brandRes = await client.query('SELECT * FROM brands WHERE id = $1', [brandId]);
        if (brandRes.rows.length === 0) {
            throw new ApiError(404, 'Brand not found');
        }
        const brand = brandRes.rows[0];

        await client.query('UPDATE seller_orders SET brand_id = NULL WHERE brand_id = $1', [brandId]);
        await client.query('UPDATE seller_payouts SET brand_id = NULL WHERE brand_id = $1', [brandId]);
        await client.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE brand_id = $1)', [brandId]);
        await client.query('DELETE FROM products WHERE brand_id = $1', [brandId]);
        await client.query('DELETE FROM brands WHERE id = $1', [brandId]);
        await client.query('DELETE FROM seller_stores WHERE id = $1', [brandId]);

        await logAuditEvent({
            userId: adminUser.id,
            action: 'SUPER_ADMIN_BRAND_DELETED',
            targetType: 'brand',
            targetId: Number(brandId),
            details: { brandName: brand.name, slug: brand.slug }
        });

        await client.query('COMMIT');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const toggleBlockUserService = async (adminUser, targetUserId) => {
    const checkUser = await pool.query('SELECT id, email, role, is_blocked FROM users WHERE id = $1', [targetUserId]);
    if (checkUser.rows.length === 0) {
        throw new ApiError(404, 'User not found');
    }

    const targetUser = checkUser.rows[0];
    if (targetUser.role === 'super_admin' || targetUser.role === 'admin') {
        throw new ApiError(403, 'Administrators cannot be blocked');
    }

    const nextBlockedState = !targetUser.is_blocked;
    const updated = await pool.query(
        'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, is_blocked',
        [nextBlockedState, targetUserId]
    );

    await logAuditEvent({
        userId: adminUser.id,
        action: nextBlockedState ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        targetType: 'user',
        targetId: Number(targetUserId),
        details: { email: targetUser.email, role: targetUser.role, is_blocked: nextBlockedState }
    });

    return updated.rows[0];
};
