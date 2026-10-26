import pool from '../db.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { logAuditEvent } from '../utils/auditLogger.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadBrandAssets = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

const uploadToCloudinary = async (file, folder = 'ecommerce/brands') => {
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
                    console.error('Cloudinary brand asset upload error, fallback to data URL:', error.message);
                    return resolve(`data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`);
                }
                resolve(result?.secure_url || null);
            }
        );
        stream.end(file.buffer);
    });
};

/**
 * Get authenticated brand's profile and business settings
 */
export const getBrandProfile = async (req, res) => {
    try {
        if (!req.brand) {
            let brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [req.user.id]);
            if (brandRes.rows.length === 0) {
                const defaultName = req.user.first_name ? `${req.user.first_name}'s Label` : 'Independent Atelier';
                const slug = `brand-${req.user.id}-${Date.now().toString(36)}`;
                const created = await pool.query(
                    `INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
                     VALUES ($1, $2, $3, $4, 'active', 5.00)
                     ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name
                     RETURNING *`,
                    [req.user.id, defaultName, slug, `Official line of ${defaultName}`]
                );
                req.brand = created.rows[0];
            } else {
                req.brand = brandRes.rows[0];
            }
        }

        const brandRes = await pool.query(
            `SELECT b.*, u.email as account_email, u.first_name, u.last_name, u.phone as owner_phone
             FROM brands b
             JOIN users u ON b.user_id = u.id
             WHERE b.id = $1`,
            [req.brand.id]
        );

        if (brandRes.rows.length === 0) {
            return res.json(req.brand);
        }

        res.json(brandRes.rows[0]);
    } catch (err) {
        console.error('Error fetching brand profile:', err);
        res.status(500).json({ error: 'Failed to fetch brand profile' });
    }
};

/**
 * Update brand details, branding assets, and policies
 */
export const updateBrandProfile = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        const name = req.body.name;
        const bio = req.body.bio || req.body.description;
        const website = req.body.website;
        const contactEmail = req.body.contact_email || req.body.contactEmail;
        const contactPhone = req.body.contact_phone || req.body.contactPhone;
        const businessRegistrationNumber = req.body.business_registration_number || req.body.businessRegistrationNumber;
        const taxId = req.body.tax_id || req.body.taxId;
        const policyReturn = req.body.policy_return || req.body.policyReturn;
        const policyShipping = req.body.policy_shipping || req.body.policyShipping;

        let logoUrl = req.body.logo_url || req.body.logoUrl;
        let bannerUrl = req.body.banner_url || req.body.bannerUrl;

        // Process file uploads from local PC
        if (req.files?.logo?.[0]) {
            logoUrl = await uploadToCloudinary(req.files.logo[0], 'ecommerce/brands/logos');
        }
        if (req.files?.banner?.[0]) {
            bannerUrl = await uploadToCloudinary(req.files.banner[0], 'ecommerce/brands/banners');
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
                policyReturn, policyShipping, req.brand.id
            ]
        );

        // Keep seller_stores in sync for backward compatibility
        if (name || bio || logoUrl || bannerUrl) {
            await pool.query(
                `UPDATE seller_stores SET 
                    name = COALESCE($1, name), 
                    bio = COALESCE($2, bio),
                    logo_url = COALESCE($3, logo_url),
                    banner_url = COALESCE($4, banner_url)
                 WHERE id = $5`,
                [name, bio, logoUrl, bannerUrl, req.brand.id]
            );
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'BRAND_PROFILE_UPDATED',
            targetEntity: 'brands',
            targetId: req.brand.id,
            details: { name, logoUpdated: Boolean(logoUrl), bannerUpdated: Boolean(bannerUrl) }
        });

        res.json({ message: 'Brand profile updated successfully', brand: updated.rows[0] });
    } catch (err) {
        console.error('Error updating brand profile:', err);
        res.status(500).json({ error: 'Failed to update brand profile' });
    }
};

/**
 * High-level brand overview metrics
 */
export const getBrandOverview = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        if (req.brand.status !== 'active') {
            return res.status(403).json({ 
                error: 'Your brand account is pending Super Admin verification. You cannot list or sell garments until verified.',
                code: 'BRAND_VERIFICATION_PENDING'
            });
        }
        const brandId = req.brand.id;

        // Products stats
        const productStats = await pool.query(
            `SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_products,
                COUNT(*) FILTER (WHERE status = 'pending_review') as pending_products
             FROM products WHERE brand_id = $1`,
            [brandId]
        );

        // Orders & revenue stats
        const orderStats = await pool.query(
            `SELECT
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending' OR fulfillment_status = 'pending') as pending_fulfillment,
                COUNT(*) FILTER (WHERE status = 'shipped' OR fulfillment_status = 'shipped') as shipped_orders,
                COUNT(*) FILTER (WHERE status = 'delivered' OR fulfillment_status = 'delivered') as delivered_orders,
                COALESCE(SUM(subtotal), 0) as gross_sales,
                COALESCE(SUM(commission_amount), 0) as total_commission,
                COALESCE(SUM(COALESCE(seller_net_earnings, (subtotal - commission_amount), 0)), 0) as net_earnings
             FROM seller_orders WHERE brand_id = $1`,
            [brandId]
        );

        // Low stock count
        const stockStats = await pool.query(
            `SELECT COUNT(*) as low_stock_count
             FROM product_variants pv
             JOIN products p ON pv.product_id = p.id
             WHERE p.brand_id = $1 AND pv.stock_quantity <= pv.low_stock_threshold`,
            [brandId]
        );

        res.json({
            brand: {
                id: req.brand.id,
                name: req.brand.name,
                slug: req.brand.slug,
                status: req.brand.status,
                commission_rate: req.brand.commission_rate
            },
            products: productStats.rows[0],
            orders: orderStats.rows[0],
            inventory: stockStats.rows[0]
        });
    } catch (err) {
        console.error('Error fetching brand overview:', err);
        res.status(500).json({ error: 'Failed to fetch brand overview' });
    }
};

/**
 * Get products belonging strictly to this brand
 */
export const getBrandProducts = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        if (req.brand.status !== 'active') {
            return res.status(403).json({ 
                error: 'Your brand account is pending Super Admin verification. You cannot list or sell garments until verified.',
                code: 'BRAND_VERIFICATION_PENDING'
            });
        }

        const productsRes = await pool.query(
            `SELECT 
                p.*,
                c.name as category_name,
                COUNT(pv.id) as variant_count,
                COALESCE(SUM(pv.stock_quantity), 0) as total_stock,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', pv.id,
                            'sku', pv.sku,
                            'size', pv.size,
                            'color', pv.color,
                            'price', COALESCE(pv.price_override, p.base_price),
                            'compare_at_price', pv.compare_at_price,
                            'stock_quantity', pv.stock_quantity,
                            'low_stock_threshold', pv.low_stock_threshold,
                            'image_urls', pv.image_urls
                        )
                    ) FILTER (WHERE pv.id IS NOT NULL),
                    '[]'::json
                ) as variants
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN product_variants pv ON p.id = pv.product_id
             WHERE p.brand_id = $1
             GROUP BY p.id, c.name
             ORDER BY p.created_at DESC`,
            [req.brand.id]
        );

        res.json(productsRes.rows);
    } catch (err) {
        console.error('Error fetching brand products:', err);
        res.status(500).json({ error: 'Failed to fetch brand products' });
    }
};

/**
 * Create a new clothing product owned by this brand
 */
export const createBrandProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        if (req.brand.status !== 'active') {
            return res.status(403).json({ 
                error: 'Your brand account is pending Super Admin verification. You cannot list or sell garments until verified.',
                code: 'BRAND_VERIFICATION_PENDING'
            });
        }

        const {
            name,
            description,
            price,
            category_id,
            gender,
            images,
            clothing_type,
            fabric_material,
            fit,
            pattern,
            season,
            care_instructions,
            variants
        } = req.body;

        if (!name || !price || !category_id) {
            return res.status(400).json({ error: 'Product name, price, and category are required' });
        }

        await client.query('BEGIN');

        const productRes = await client.query(
            `INSERT INTO products (
                name, description, base_price, category_id, gender, images,
                seller_id, store_id, brand_id, brand,
                clothing_type, fabric_material, fit, pattern, season, care_instructions,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'approved')
            RETURNING *`,
            [
                name, description, price, category_id, gender || 'Unisex', images || [],
                req.user.id, req.brand.id, req.brand.id, req.brand.name,
                clothing_type || null, fabric_material || null, fit || null, pattern || null, season || null, care_instructions || null
            ]
        );
        const product = { ...productRes.rows[0], price: productRes.rows[0].base_price };

        // Insert variants if provided
        const createdVariants = [];
        if (Array.isArray(variants) && variants.length > 0) {
            for (const v of variants) {
                const varRes = await client.query(
                    `INSERT INTO product_variants (
                        product_id, sku, size, color, price_override, compare_at_price, stock_quantity, low_stock_threshold, image_urls
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *`,
                    [
                        product.id,
                        v.sku || `${product.id}-${v.size || 'STD'}-${(v.color || 'CLR').substring(0, 3)}`,
                        v.size || 'M',
                        v.color || 'Standard',
                        v.price || product.base_price,
                        v.compare_at_price || null,
                        parseInt(v.stock_quantity, 10) || 0,
                        parseInt(v.low_stock_threshold, 10) || 5,
                        v.image_urls || images || []
                    ]
                );
                createdVariants.push({ ...varRes.rows[0], price: varRes.rows[0].price_override || product.base_price });
            }
        } else {
            // Default variant
            const defaultVar = await client.query(
                `INSERT INTO product_variants (product_id, sku, size, color, price_override, stock_quantity, image_urls)
                 VALUES ($1, $2, 'Standard', 'Default', $3, 10, $4)
                 RETURNING *`,
                [product.id, `${product.id}-STD-DEF`, product.base_price, images || []]
            );
            createdVariants.push({ ...defaultVar.rows[0], price: product.base_price });
        }

        await client.query('COMMIT');

        await logAuditEvent({
            userId: req.user.id,
            action: 'BRAND_PRODUCT_CREATED',
            targetType: 'product',
            targetId: product.id,
            details: { name: product.name, brandId: req.brand.id }
        });

        res.status(201).json({
            message: 'Clothing product created successfully',
            product: { ...product, variants: createdVariants }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating brand product:', err);
        res.status(500).json({ error: 'Failed to create brand product: ' + err.message });
    } finally {
        client.release();
    }
};

/**
 * Update an existing brand product
 */
export const updateBrandProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            category_id,
            gender,
            images,
            clothing_type,
            fabric_material,
            fit,
            pattern,
            season,
            care_instructions,
            variants
        } = req.body;

        await client.query('BEGIN');

        // Verify brand ownership
        const check = await client.query('SELECT * FROM products WHERE id = $1 AND brand_id = $2', [id, req.brand.id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found or access denied for this brand' });
        }

        const updatedRes = await client.query(
            `UPDATE products SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                base_price = COALESCE($3, base_price),
                category_id = COALESCE($4, category_id),
                gender = COALESCE($5, gender),
                images = COALESCE($6, images),
                clothing_type = COALESCE($7, clothing_type),
                fabric_material = COALESCE($8, fabric_material),
                fit = COALESCE($9, fit),
                pattern = COALESCE($10, pattern),
                season = COALESCE($11, season),
                care_instructions = COALESCE($12, care_instructions),
                updated_at = NOW()
             WHERE id = $13 AND brand_id = $14
             RETURNING *`,
            [
                name, description, price, category_id, gender, images,
                clothing_type, fabric_material, fit, pattern, season, care_instructions,
                id, req.brand.id
            ]
        );

        if (Array.isArray(variants)) {
            for (const v of variants) {
                if (v.id) {
                    await client.query(
                        `UPDATE product_variants SET
                            sku = COALESCE($1, sku),
                            size = COALESCE($2, size),
                            color = COALESCE($3, color),
                            price = COALESCE($4, price),
                            compare_at_price = $5,
                            stock_quantity = COALESCE($6, stock_quantity),
                            low_stock_threshold = COALESCE($7, low_stock_threshold)
                         WHERE id = $8 AND product_id = $9`,
                        [v.sku, v.size, v.color, v.price, v.compare_at_price, v.stock_quantity, v.low_stock_threshold, v.id, id]
                    );
                } else if (v.size && v.color) {
                    await client.query(
                        `INSERT INTO product_variants (product_id, sku, size, color, price, compare_at_price, stock_quantity, low_stock_threshold)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [id, v.sku || `${id}-${v.size}-${v.color}`, v.size, v.color, v.price || updatedRes.rows[0].price, v.compare_at_price, v.stock_quantity || 0, v.low_stock_threshold || 5]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.json({ message: 'Product updated successfully', product: updatedRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating brand product:', err);
        res.status(500).json({ error: 'Failed to update brand product' });
    } finally {
        client.release();
    }
};

/**
 * Delete a brand product
 */
export const deleteBrandProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 AND brand_id = $2 RETURNING id, name',
            [id, req.brand.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found or access denied' });
        }

        res.json({ message: 'Product deleted successfully', id });
    } catch (err) {
        console.error('Error deleting brand product:', err);
        res.status(500).json({ error: 'Failed to delete brand product' });
    }
};

/**
 * Get orders containing items for this brand
 */
export const getBrandOrders = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        if (req.brand.status !== 'active') {
            return res.status(403).json({ 
                error: 'Your brand account is pending Super Admin verification. You cannot list or sell garments until verified.',
                code: 'BRAND_VERIFICATION_PENDING'
            });
        }

        const ordersRes = await pool.query(
            `SELECT 
                so.*,
                o.id AS order_number,
                o.created_at AS parent_order_date,
                o.shipping_address,
                u.email AS customer_email,
                u.first_name AS customer_first_name,
                u.last_name AS customer_last_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'order_item_id', oi.id,
                            'variant_id', oi.variant_id,
                            'product_name', p.name,
                            'images', p.images,
                            'image_urls', pv.image_urls,
                            'quantity', oi.quantity,
                            'price_at_purchase', oi.price_at_purchase,
                            'size', pv.size,
                            'color', pv.color,
                            'fulfillment_status', oi.fulfillment_status,
                            'commission_rate', oi.commission_rate,
                            'commission_amount', oi.commission_amount,
                            'seller_net_amount', oi.seller_net_amount
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items
             FROM seller_orders so
             JOIN orders o ON so.order_id = o.id
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON (oi.seller_order_id = so.id OR (oi.order_id = so.order_id AND (oi.seller_id = so.seller_id OR oi.seller_id = (SELECT user_id FROM brands WHERE id = so.brand_id))))
             LEFT JOIN product_variants pv ON oi.variant_id = pv.id
             LEFT JOIN products p ON pv.product_id = p.id
             WHERE so.brand_id = $1 OR so.seller_id = (SELECT user_id FROM brands WHERE id = $1)
             GROUP BY so.id, o.id, o.created_at, o.shipping_address, u.email, u.first_name, u.last_name
             ORDER BY so.created_at DESC`,
            [req.brand.id]
        );

        res.json(ordersRes.rows);
    } catch (err) {
        console.error('Error fetching brand orders:', err);
        res.status(500).json({ error: 'Failed to fetch brand orders' });
    }
};

/**
 * Update order fulfillment status (shipment/tracking)
 */
export const updateOrderFulfillment = async (req, res) => {
    try {
        const { id } = req.params;
        const { fulfillment_status, status, tracking_number, trackingNumber, carrier, shippingCarrier } = req.body;
        const resolvedStatus = fulfillment_status || status;
        const resolvedTracking = tracking_number || trackingNumber;
        const resolvedCarrier = carrier || shippingCarrier;

        const brandId = req.brand?.id;
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

        const updateRes = await pool.query(
            `UPDATE seller_orders SET
                status = COALESCE($1, status),
                fulfillment_status = COALESCE($1, fulfillment_status),
                tracking_number = COALESCE($2, tracking_number),
                shipping_carrier = COALESCE($3, shipping_carrier),
                carrier = COALESCE($3, carrier),
                shipped_at = CASE WHEN $1 = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
                delivered_at = CASE WHEN $1 = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
                updated_at = NOW()
             WHERE id = $4 AND (
                $6 = true OR
                brand_id = $5 OR 
                seller_id = $7 OR
                seller_id = (SELECT user_id FROM brands WHERE id = $5)
             )
             RETURNING *`,
            [resolvedStatus, resolvedTracking, resolvedCarrier, id, brandId || 0, isAdmin, req.user.id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Fulfillment order not found or access denied' });
        }

        const updatedOrder = updateRes.rows[0];
        const parentOrderId = updatedOrder.order_id;

        // Synchronize corresponding order items
        if (resolvedStatus) {
            await pool.query(
                'UPDATE order_items SET fulfillment_status = $1 WHERE seller_order_id = $2',
                [resolvedStatus, id]
            );
        }

        // Dynamically recalculate and update parent order status
        if (parentOrderId) {
            const allSubOrders = await pool.query(
                'SELECT status, fulfillment_status FROM seller_orders WHERE order_id = $1',
                [parentOrderId]
            );
            const statuses = allSubOrders.rows.map(r => (r.fulfillment_status || r.status || '').toLowerCase());
            let parentStatus = 'processing';
            if (statuses.length > 0 && statuses.every(s => s === 'delivered')) {
                parentStatus = 'delivered';
            } else if (statuses.some(s => s === 'shipped' || s === 'in_transit')) {
                parentStatus = 'shipped';
            } else if (statuses.length > 0 && statuses.every(s => s === 'cancelled')) {
                parentStatus = 'cancelled';
            }
            await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [parentStatus, parentOrderId]);
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'BRAND_ORDER_FULFILLED',
            targetType: 'seller_order',
            targetId: id,
            details: { status: resolvedStatus, trackingNumber: resolvedTracking, carrier: resolvedCarrier }
        });

        res.json({ message: 'Fulfillment updated successfully', order: updatedOrder });
    } catch (err) {
        console.error('Error updating order fulfillment:', err);
        res.status(500).json({ error: 'Failed to update order fulfillment' });
    }
};

/**
 * Sales and revenue analytics for brand
 */
export const getBrandAnalytics = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(403).json({ error: 'Brand context required' });
        }

        if (req.brand.status !== 'active') {
            return res.status(403).json({ 
                error: 'Your brand account is pending Super Admin verification. You cannot list or sell garments until verified.',
                code: 'BRAND_VERIFICATION_PENDING'
            });
        }

        // Daily revenue for last 30 days
        const revenueRes = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders_count,
                COALESCE(SUM(subtotal), 0) as gross_sales,
                COALESCE(SUM(commission_amount), 0) as platform_fees,
                COALESCE(SUM(COALESCE(seller_net_earnings, (subtotal - commission_amount), 0)), 0) as net_earnings
             FROM seller_orders
             WHERE brand_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [req.brand.id]
        );

        // Top clothing products
        const topProducts = await pool.query(
            `SELECT 
                p.id, p.name, p.images, p.clothing_type,
                COUNT(oi.id) as units_sold,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue
             FROM order_items oi
             JOIN product_variants pv ON oi.variant_id = pv.id
             JOIN products p ON pv.product_id = p.id
             WHERE p.brand_id = $1
             GROUP BY p.id, p.name, p.images, p.clothing_type
             ORDER BY units_sold DESC
             LIMIT 5`,
            [req.brand.id]
        );

        res.json({
            recent_revenue: revenueRes.rows,
            top_products: topProducts.rows
        });
    } catch (err) {
        console.error('Error fetching brand analytics:', err);
        res.status(500).json({ error: 'Failed to fetch brand analytics' });
    }
};

/**
 * Public catalog of approved marketplace brands
 */
export const getPublicBrands = async (req, res) => {
    try {
        const brands = await pool.query(
            `SELECT 
                b.id, b.name, b.slug, b.logo_url, b.banner_url, b.bio, b.website, b.is_featured,
                COUNT(p.id) as product_count
             FROM brands b
             LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'approved'
             WHERE b.status = 'active'
             GROUP BY b.id
             ORDER BY b.is_featured DESC, product_count DESC, b.name ASC`
        );
        res.json(brands.rows);
    } catch (err) {
        console.error('Error fetching public brands:', err);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
};

/**
 * Public brand storefront details with clothing collection
 */
export const getPublicBrandBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const brandRes = await pool.query(
            `SELECT id, name, slug, logo_url, banner_url, bio, website, policy_return, policy_shipping, is_featured, created_at
             FROM brands WHERE slug = $1 AND status = 'active'`,
            [slug]
        );

        if (brandRes.rows.length === 0) {
            return res.status(404).json({ error: 'Brand not found or inactive' });
        }
        const brand = brandRes.rows[0];

        const productsRes = await pool.query(
            `SELECT 
                p.*,
                c.name as category_name,
                COALESCE(SUM(pv.stock_quantity), 0) as total_stock
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN product_variants pv ON p.id = pv.product_id
             WHERE p.brand_id = $1 AND p.status = 'approved'
             GROUP BY p.id, c.name
             ORDER BY p.created_at DESC`,
            [brand.id]
        );

        res.json({
            brand,
            products: productsRes.rows
        });
    } catch (err) {
        console.error('Error fetching public brand:', err);
        res.status(500).json({ error: 'Failed to fetch brand' });
    }
};

/**
 * Brand response to Super Admin proposed commission rate change
 */
export const respondToCommissionProposal = async (req, res) => {
    return res.json({
        message: 'Marketplace commission is fixed at a static 5% for all brands.',
        commission_rate: 5.00,
        commission_status: 'approved'
    });
};
