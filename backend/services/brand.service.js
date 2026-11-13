import pool from '../db.js';
import cloudinary from '../config/cloudinary.js';
import { ApiError } from '../middleware/error.middleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const uploadBrandAsset = async (file, folder = 'ecommerce/brands') => {
    if (!file) return null;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName.includes('your_') || !process.env.CLOUDINARY_API_KEY) {
        return `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
    }
    return new Promise((resolve) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error.message);
                    return resolve(`data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`);
                }
                resolve(result?.secure_url || null);
            }
        );
        stream.end(file.buffer);
    });
};

export const getPublicBrandsService = async () => {
    const result = await pool.query(`
        SELECT b.id, b.name, b.slug, b.logo_url, b.banner_url, b.bio, b.website,
               b.created_at, b.status,
               COUNT(p.id) AS product_count
        FROM brands b
        LEFT JOIN products p ON (p.brand_id = b.id OR (p.brand_id IS NULL AND p.seller_id = b.user_id)) AND p.status = 'approved'
        WHERE b.status = 'active'
        GROUP BY b.id
        ORDER BY b.name ASC
    `);
    return result.rows;
};

export const getPublicBrandBySlugService = async (slug) => {
    const brandResult = await pool.query(
        `SELECT b.*,
                COALESCE(b.logo_url, s.logo_url) AS logo_url,
                COALESCE(b.banner_url, s.banner_url) AS banner_url,
                COALESCE(b.bio, s.bio) AS bio
         FROM brands b
         LEFT JOIN seller_stores s ON (s.slug = b.slug OR s.id = b.id)
         WHERE b.slug = $1`,
        [slug]
    );

    let brand = brandResult.rows[0];
    if (!brand) {
        const fallbackStore = await pool.query('SELECT * FROM seller_stores WHERE slug = $1', [slug]);
        if (fallbackStore.rows.length === 0) {
            throw new ApiError(404, 'Brand not found');
        }
        brand = fallbackStore.rows[0];
    }

    const productsResult = await pool.query(
        `SELECT p.*,
                (
                    SELECT v.image_urls[1] 
                    FROM product_variants v 
                    WHERE v.product_id = p.id 
                    ORDER BY v.id ASC 
                    LIMIT 1
                ) AS main_image
         FROM products p
         WHERE (p.brand_id = $1 OR (p.brand_id IS NULL AND p.seller_id = $2) OR p.store_id = $1)
           AND p.status = 'approved'
         ORDER BY p.created_at DESC`,
        [brand.id, brand.user_id]
    );

    return {
        brand,
        products: productsResult.rows
    };
};

export const getBrandProfileService = async (user, currentBrand) => {
    let resolvedBrand = currentBrand;
    if (!resolvedBrand) {
        let brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [user.id]);
        if (brandRes.rows.length === 0) {
            const defaultName = user.first_name ? `${user.first_name}'s Label` : 'Independent Atelier';
            const slug = `brand-${user.id}-${Date.now().toString(36)}`;
            const created = await pool.query(
                `INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
                 VALUES ($1, $2, $3, $4, 'active', 5.00)
                 ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name
                 RETURNING *`,
                [user.id, defaultName, slug, `Official line of ${defaultName}`]
            );
            resolvedBrand = created.rows[0];
        } else {
            resolvedBrand = brandRes.rows[0];
        }
    }

    const brandRes = await pool.query(
        `SELECT b.*, u.email as account_email, u.first_name, u.last_name, u.phone as owner_phone
         FROM brands b
         JOIN users u ON b.user_id = u.id
         WHERE b.id = $1`,
        [resolvedBrand.id]
    );

    return brandRes.rows[0] || resolvedBrand;
};

export const updateBrandProfileService = async (user, brand, body, files) => {
    if (!brand) {
        throw new ApiError(403, 'Brand context required');
    }

    const name = body.name;
    const bio = body.bio || body.description;
    const website = body.website;
    const contactEmail = body.contact_email || body.contactEmail;
    const contactPhone = body.contact_phone || body.contactPhone;
    const businessRegistrationNumber = body.business_registration_number || body.businessRegistrationNumber;
    const taxId = body.tax_id || body.taxId;
    const policyReturn = body.policy_return || body.policyReturn;
    const policyShipping = body.policy_shipping || body.policyShipping;

    let logoUrl = body.logo_url || body.logoUrl;
    let bannerUrl = body.banner_url || body.bannerUrl;

    if (files?.logo?.[0]) {
        logoUrl = await uploadBrandAsset(files.logo[0], 'ecommerce/brands/logos');
    }
    if (files?.banner?.[0]) {
        bannerUrl = await uploadBrandAsset(files.banner[0], 'ecommerce/brands/banners');
    }

    const updated = await pool.query(
        `UPDATE brands SET
            name = COALESCE($1, name),
            bio = COALESCE($2, bio),
            website = COALESCE($3, website),
            contact_email = COALESCE($4, contact_email),
            contact_phone = COALESCE($5, contact_phone),
            business_registration_number = COALESCE($6, business_registration_number),
            tax_id = COALESCE($7, tax_id),
            logo_url = COALESCE($8, logo_url),
            banner_url = COALESCE($9, banner_url),
            policy_return = COALESCE($10, policy_return),
            policy_shipping = COALESCE($11, policy_shipping),
            updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
            name, bio, website, contactEmail, contactPhone,
            businessRegistrationNumber, taxId, logoUrl, bannerUrl,
            policyReturn, policyShipping, brand.id
        ]
    );

    if (name || bio || logoUrl || bannerUrl) {
        await pool.query(
            `UPDATE seller_stores SET 
                name = COALESCE($1, name), 
                bio = COALESCE($2, bio),
                logo_url = COALESCE($3, logo_url),
                banner_url = COALESCE($4, banner_url)
             WHERE id = $5`,
            [name, bio, logoUrl, bannerUrl, brand.id]
        );
    }

    await logAuditEvent({
        userId: user.id,
        action: 'BRAND_PROFILE_UPDATED',
        targetEntity: 'brands',
        targetId: brand.id,
        details: { name, logoUpdated: Boolean(logoUrl), bannerUpdated: Boolean(bannerUrl) }
    });

    return updated.rows[0];
};

export const getBrandOverviewService = async (brandId, userId) => {
    const ordersRes = await pool.query(
        `SELECT 
            COUNT(DISTINCT so.id) AS total_orders,
            COALESCE(SUM(so.subtotal), 0) AS gross_sales,
            COALESCE(SUM(so.commission_amount), 0) AS commission_paid,
            COALESCE(SUM(so.seller_net_earnings), 0) AS net_earnings
         FROM seller_orders so
         WHERE (so.brand_id = $1 OR so.seller_id = $2)`,
        [brandId, userId]
    );

    const pendingOrdersRes = await pool.query(
        `SELECT COUNT(*) AS count
         FROM seller_orders
         WHERE (brand_id = $1 OR seller_id = $2)
           AND status IN ('unfulfilled', 'pending')`,
        [brandId, userId]
    );

    const productsRes = await pool.query(
        `SELECT 
            COUNT(*) AS total_products,
            COUNT(*) FILTER (WHERE status = 'approved') AS active_products,
            COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review_products
         FROM products
         WHERE (brand_id = $1 OR seller_id = $2)`,
        [brandId, userId]
    );

    const lowStockRes = await pool.query(
        `SELECT pv.id, pv.sku, pv.size, pv.color, pv.stock_quantity, pv.low_stock_threshold,
                p.name AS product_name, p.id AS product_id
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.id
         WHERE (p.brand_id = $1 OR p.seller_id = $2)
           AND pv.stock_quantity <= pv.low_stock_threshold
         ORDER BY pv.stock_quantity ASC
         LIMIT 6`,
        [brandId, userId]
    );

    const recentOrdersRes = await pool.query(
        `SELECT so.*, o.created_at, o.shipping_address
         FROM seller_orders so
         JOIN orders o ON so.order_id = o.id
         WHERE (so.brand_id = $1 OR so.seller_id = $2)
         ORDER BY so.created_at DESC
         LIMIT 5`,
        [brandId, userId]
    );

    return {
        orders: ordersRes.rows[0],
        pendingShipments: parseInt(pendingOrdersRes.rows[0]?.count || 0, 10),
        products: productsRes.rows[0],
        lowStockItems: lowStockRes.rows,
        recentOrders: recentOrdersRes.rows
    };
};

export const getBrandProductsService = async (brandId, userId) => {
    const result = await pool.query(
        `SELECT p.*, c.name AS category_name,
                COUNT(pv.id) AS variant_count,
                COALESCE(SUM(pv.stock_quantity), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON p.id = pv.product_id
         WHERE (p.brand_id = $1 OR p.seller_id = $2)
         GROUP BY p.id, c.name
         ORDER BY p.created_at DESC`,
        [brandId, userId]
    );

    const productsWithVariants = await Promise.all(
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

    return productsWithVariants;
};

export const getBrandOrdersService = async (brandId, userId) => {
    const ordersRes = await pool.query(
        `SELECT so.*, o.created_at AS order_date, o.shipping_address, o.user_id AS buyer_id,
                u.first_name AS buyer_first_name, u.last_name AS buyer_last_name, u.email AS buyer_email
         FROM seller_orders so
         JOIN orders o ON so.order_id = o.id
         JOIN users u ON o.user_id = u.id
         WHERE (so.brand_id = $1 OR so.seller_id = $2)
         ORDER BY so.created_at DESC`,
        [brandId, userId]
    );

    const ordersWithItems = await Promise.all(
        ordersRes.rows.map(async (so) => {
            const itemsRes = await pool.query(
                `SELECT oi.*, p.name AS product_name, pv.size, pv.color, pv.sku, pv.image_urls
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

    return ordersWithItems;
};

export const updateBrandOrderFulfillmentService = async (user, brandId, sellerOrderId, body) => {
    const { status, tracking_number, carrier } = body;
    const validStatuses = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (status && !validStatuses.includes(status)) {
        throw new ApiError(400, 'Invalid fulfillment status');
    }

    const currentRes = await pool.query(
        `SELECT * FROM seller_orders WHERE id = $1 AND (brand_id = $2 OR seller_id = $3)`,
        [sellerOrderId, brandId, user.id]
    );

    if (currentRes.rows.length === 0) {
        throw new ApiError(404, 'Fulfillment order not found or not owned by brand');
    }

    const updated = await pool.query(
        `UPDATE seller_orders SET
            status = COALESCE($1, status),
            fulfillment_status = COALESCE($1, fulfillment_status),
            tracking_number = COALESCE($2, tracking_number),
            carrier = COALESCE($3, carrier),
            shipping_carrier = COALESCE($3, shipping_carrier),
            shipped_at = CASE WHEN $1 = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
            delivered_at = CASE WHEN $1 = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
            updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, tracking_number, carrier, sellerOrderId]
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
        details: { status, tracking_number, carrier }
    });

    return updated.rows[0];
};

export const getBrandAnalyticsService = async (brandId, userId) => {
    const summaryRes = await pool.query(
        `SELECT 
            COALESCE(SUM(so.subtotal), 0) AS total_revenue,
            COALESCE(SUM(so.seller_net_earnings), 0) AS net_payout,
            COALESCE(SUM(so.commission_amount), 0) AS total_commission_paid,
            COUNT(DISTINCT so.id) AS total_orders,
            COUNT(DISTINCT o.user_id) AS unique_customers
         FROM seller_orders so
         JOIN orders o ON so.order_id = o.id
         WHERE (so.brand_id = $1 OR so.seller_id = $2)`,
        [brandId, userId]
    );

    const monthlySalesRes = await pool.query(
        `SELECT 
            TO_CHAR(DATE_TRUNC('month', so.created_at), 'YYYY-MM') AS month,
            SUM(so.subtotal) AS gross,
            SUM(so.seller_net_earnings) AS net,
            COUNT(so.id) AS order_count
         FROM seller_orders so
         WHERE (so.brand_id = $1 OR so.seller_id = $2)
           AND so.created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', so.created_at)
         ORDER BY month ASC`,
        [brandId, userId]
    );

    const topProductsRes = await pool.query(
        `SELECT 
            p.id, p.name,
            SUM(oi.quantity) AS units_sold,
            SUM(oi.quantity * oi.price_at_purchase) AS revenue
         FROM order_items oi
         JOIN product_variants pv ON oi.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE (p.brand_id = $1 OR p.seller_id = $2)
         GROUP BY p.id, p.name
         ORDER BY units_sold DESC
         LIMIT 5`,
        [brandId, userId]
    );

    return {
        summary: summaryRes.rows[0],
        monthlySales: monthlySalesRes.rows,
        topProducts: topProductsRes.rows
    };
};
