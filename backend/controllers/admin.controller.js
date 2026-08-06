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
