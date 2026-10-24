import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const protectRoute = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (jwtErr) {
                return res.status(401).json({ error: 'Session expired. Please sign in again.' });
            }

            // Fetch live user status to ensure revoked or changed roles are reflected immediately
            const userRes = await pool.query(
                'SELECT id, email, first_name, last_name, role, is_blocked FROM users WHERE id = $1',
                [decoded.id]
            );

            if (userRes.rows.length === 0) {
                return res.status(401).json({ error: 'User account no longer exists' });
            }

            if (userRes.rows[0].is_blocked) {
                return res.status(403).json({ 
                    error: 'Your account has been suspended by the platform administrator.',
                    code: 'USER_BLOCKED'
                });
            }

            req.user = userRes.rows[0];
            next();
        } catch (error) {
            console.error('Server error during auth check:', error.message);
            return res.status(500).json({ error: 'Authentication service temporarily busy. Please retry.' });
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
        let brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [req.user.id]);
        if (brandRes.rows.length === 0) {
            const defaultName = req.user.first_name ? `${req.user.first_name}'s Flagship Atelier` : 'Platform Flagship Atelier';
            const slug = `admin-atelier-${req.user.id}`;
            const created = await pool.query(
                `INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
                 VALUES ($1, $2, $3, $4, 'active', 0.00)
                 ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name
                 RETURNING *`,
                [req.user.id, defaultName, slug, 'Official platform flagship brand and administration showcase']
            );
            brandRes = created;
        }
        req.brand = brandRes.rows[0];
        req.sellerStore = req.brand;
        return next();
    }

    if (req.user.role === 'seller' || req.user.role === 'brand') {
        let brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [req.user.id]);
        if (brandRes.rows.length === 0) {
            const defaultName = req.user.first_name ? `${req.user.first_name}'s Label` : 'Independent Atelier';
            const slug = `${defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
            const created = await pool.query(
                `INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
                 VALUES ($1, $2, $3, $4, 'pending', 10.00)
                 RETURNING *`,
                [req.user.id, defaultName, slug, `Official line of ${defaultName}`]
            );
            brandRes = created;
        }
        const brand = brandRes.rows[0];
        if (brand.status === 'suspended') {
            return res.status(403).json({ error: 'Your brand account is currently suspended. Please contact platform administration.', code: 'BRAND_SUSPENDED' });
        }
        if (brand.status === 'rejected') {
            return res.status(403).json({ error: 'Your brand application was not approved.', code: 'BRAND_REJECTED' });
        }

        // Attach brand context (including status: 'pending' so portal can alert seller to verification)
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
