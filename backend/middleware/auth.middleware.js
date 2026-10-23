import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const protectRoute = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch live user status to ensure revoked or changed roles are reflected immediately
            const userRes = await pool.query(
                'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
                [decoded.id]
            );

            if (userRes.rows.length === 0) {
                return res.status(401).json({ error: 'User no longer exists' });
            }

            req.user = userRes.rows[0];
            next();
        } catch (error) {
            console.error('Not authorized, token failed:', error.message);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

export const sellerRoute = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        // Admin can act as seller or view seller tools
        const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1', [req.user.id]);
        req.sellerStore = storeRes.rows[0] || null;
        return next();
    }

    if (req.user.role === 'seller') {
        const storeRes = await pool.query('SELECT * FROM seller_stores WHERE user_id = $1 AND is_active = true', [req.user.id]);
        if (storeRes.rows.length === 0) {
            return res.status(403).json({ error: 'Seller store is suspended or does not exist' });
        }
        req.sellerStore = storeRes.rows[0];
        return next();
    }

    return res.status(403).json({ error: 'Access restricted to authorized sellers' });
};

export const adminRoute = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        return res.status(403).json({ error: 'Not authorized as an admin' });
    }
};

export const superAdminRoute = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        return res.status(403).json({ error: 'Requires Super Admin privileges' });
    }
};
