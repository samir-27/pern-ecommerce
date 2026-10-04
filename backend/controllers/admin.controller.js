import pool from '../db.js';

export const getAdminOverview = async (req, res) => {
    try {
        const [productsResult, ordersResult, usersResult] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS count FROM products'),
            pool.query('SELECT COUNT(*)::int AS count FROM orders'),
            pool.query('SELECT COUNT(*)::int AS count FROM users')
        ]);

        res.json({
            products: productsResult.rows[0]?.count || 0,
            orders: ordersResult.rows[0]?.count || 0,
            users: usersResult.rows[0]?.count || 0
        });
    } catch (err) {
        console.error('Error fetching admin overview:', err.message);
        res.status(500).json({ error: 'Server error fetching admin overview' });
    }
};

export const getAdminProducts = async (req, res) => {
    try {
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
            GROUP BY p.id, c.name
            ORDER BY p.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin products:', err.message);
        res.status(500).json({ error: 'Server error fetching products' });
    }
};

export const getAdminOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.id, o.total_amount, o.status, o.shipping_address, o.created_at,
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
                           'image_urls', pv.image_urls
                       )) FILTER (WHERE oi.variant_id IS NOT NULL),
                       '[]'::json
                   ) AS items
            FROM orders o
            JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN product_variants pv ON pv.id = oi.variant_id
            LEFT JOIN products p ON p.id = pv.product_id
            GROUP BY o.id, u.id
            ORDER BY o.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};