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

export const brandRoute = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        const brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [req.user.id]);
        req.brand = brandRes.rows[0] || null;
        req.sellerStore = req.brand;
        return next();
    }

    if (req.user.role === 'seller' || req.user.role === 'brand') {
        const brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [req.user.id]);
        if (brandRes.rows.length === 0) {
            return res.status(403).json({ error: 'No brand profile registered for this account', code: 'NO_BRAND' });
        }
        const brand = brandRes.rows[0];
        if (brand.status === 'suspended') {
            return res.status(403).json({ error: 'Your brand account is currently suspended. Please contact platform administration.', code: 'BRAND_SUSPENDED' });
        }
        if (brand.status === 'pending') {
            return res.status(403).json({ error: 'Your brand application is currently under review by Super Admin.', code: 'BRAND_PENDING' });
        }
        if (brand.status === 'rejected') {
            return res.status(403).json({ error: 'Your brand application was not approved.', code: 'BRAND_REJECTED' });
        }
        req.brand = brand;
        req.sellerStore = brand;
        return next();
    }

    return res.status(403).json({ error: 'Access restricted to authorized brand sellers', code: 'UNAUTHORIZED_ROLE' });
};

export const sellerRoute = brandRoute;

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
