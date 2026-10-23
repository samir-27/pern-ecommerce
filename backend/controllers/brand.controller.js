import pool from '../db.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Get authenticated brand's profile and business settings
 */
export const getBrandProfile = async (req, res) => {
    try {
        if (!req.brand) {
            return res.status(404).json({ error: 'No brand profile associated with this account' });
        }

        const brandRes = await pool.query(
            `SELECT b.*, u.email as account_email, u.first_name, u.last_name, u.phone as owner_phone
             FROM brands b
             JOIN users u ON b.user_id = u.id
             WHERE b.id = $1`,
            [req.brand.id]
        );

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

        const {
            name,
            bio,
            website,
            contact_email,
            contact_phone,
            business_registration_number,
            tax_id,
            logo_url,
            banner_url,
            policy_return,
            policy_shipping
        } = req.body;

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
                name, bio, website, contact_email, contact_phone,
                business_registration_number, tax_id, logo_url, banner_url,
                policy_return, policy_shipping, req.brand.id
            ]
        );

        // Keep seller_stores in sync for backward compatibility
        if (name || bio) {
            await pool.query(
                `UPDATE seller_stores SET name = COALESCE($1, name), bio = COALESCE($2, bio) WHERE id = $3`,
                [name, bio, req.brand.id]
            );
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'BRAND_PROFILE_UPDATED',
            targetType: 'brand',
            targetId: req.brand.id,
            details: { updatedFields: Object.keys(req.body) }
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
                COALESCE(SUM(COALESCE(seller_net_earnings, net_payout, 0)), 0) as net_earnings
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
                            'low_stock_threshold', pv.low_stock_threshold
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

        const {
            name,
            description,
            price,
            category_id,
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
                name, description, base_price, category_id, images,
                seller_id, store_id, brand_id, brand,
                clothing_type, fabric_material, fit, pattern, season, care_instructions,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'approved')
            RETURNING *`,
            [
                name, description, price, category_id, images || [],
                req.user.id, req.brand.id, req.brand.id, req.brand.name,
                clothing_type || 'Apparel', fabric_material, fit, pattern, season, care_instructions
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
                images = COALESCE($5, images),
                clothing_type = COALESCE($6, clothing_type),
                fabric_material = COALESCE($7, fabric_material),
                fit = COALESCE($8, fit),
                pattern = COALESCE($9, pattern),
                season = COALESCE($10, season),
                care_instructions = COALESCE($11, care_instructions),
                updated_at = NOW()
             WHERE id = $12 AND brand_id = $13
             RETURNING *`,
            [
                name, description, price, category_id, images,
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
                            'variant_id', oi.variant_id,
                            'product_name', p.name,
                            'images', p.images,
                            'quantity', oi.quantity,
                            'price_at_purchase', oi.price_at_purchase,
                            'size', pv.size,
                            'color', pv.color
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items
             FROM seller_orders so
             JOIN orders o ON so.order_id = o.id
             JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON oi.seller_order_id = so.id
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
        const { fulfillment_status, tracking_number, carrier } = req.body;

        const updateRes = await pool.query(
            `UPDATE seller_orders SET
                status = COALESCE($1, status),
                fulfillment_status = COALESCE($1, fulfillment_status),
                tracking_number = COALESCE($2, tracking_number),
                shipping_carrier = COALESCE($3, shipping_carrier),
                carrier = COALESCE($3, carrier),
                shipped_at = CASE WHEN $1 = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
                delivered_at = CASE WHEN $1 = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END
             WHERE id = $4 AND (brand_id = $5 OR seller_id = (SELECT user_id FROM brands WHERE id = $5))
             RETURNING *`,
            [fulfillment_status, tracking_number, carrier, id, req.brand.id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ error: 'Fulfillment order not found or access denied' });
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'BRAND_ORDER_FULFILLED',
            targetType: 'seller_order',
            targetId: id,
            details: { fulfillment_status, tracking_number, carrier }
        });

        res.json({ message: 'Fulfillment updated successfully', order: updateRes.rows[0] });
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

        // Daily revenue for last 30 days
        const revenueRes = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders_count,
                COALESCE(SUM(subtotal), 0) as gross_sales,
                COALESCE(SUM(commission_amount), 0) as platform_fees,
                COALESCE(SUM(COALESCE(seller_net_earnings, net_payout, 0)), 0) as net_earnings
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
