import '../env.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const registerUser = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role',
            [email, passwordHash, firstName, lastName]
        );

        const token = jwt.sign(
            { 
                id: newUser.rows[0].id,
                role: newUser.rows[0].role 
            },
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

export const registerBrandSeller = async (req, res) => {
    const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone, 
        brandName, 
        bio, 
        website, 
        businessNumber,
        policyReturn,
        policyShipping 
    } = req.body;

    if (!email || !password || !firstName || !brandName) {
        return res.status(400).json({ error: 'Email, password, personal name, and Brand name are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'brand';
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);

        const userRes = await client.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, phone, role',
            [email, passwordHash, firstName, lastName || '', phone || null, 'seller']
        );
        const user = userRes.rows[0];

        const brandRes = await client.query(
            `INSERT INTO brands (
                user_id, name, slug, bio, website, contact_email, contact_phone, 
                business_registration_number, policy_return, policy_shipping, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
            RETURNING *`,
            [
                user.id,
                brandName.trim(),
                slug,
                bio || `Official marketplace brand for ${brandName}`,
                website || null,
                email,
                phone || null,
                businessNumber || null,
                policyReturn || 'Standard 14-day unworn clothing returns accepted.',
                policyShipping || 'Dispatched within 2 business days.'
            ]
        );
        const brand = brandRes.rows[0];

        // Also populate backward-compatible seller_stores
        await client.query(
            `INSERT INTO seller_stores (id, user_id, name, slug, bio, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             ON CONFLICT (id) DO NOTHING`,
            [brand.id, user.id, brand.name, brand.slug, brand.bio]
        );

        await client.query('COMMIT');

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        res.status(201).json({
            message: 'Brand Seller registered successfully',
            token,
            user,
            brand
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during brand registration:', err);
        res.status(500).json({ error: 'Server error during brand registration: ' + err.message });
    } finally {
        client.release();
    }
};

export const loginUser = async (req, res) => {
    const { email, password, targetRole } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Enforce role-appropriate login routing
        if (targetRole === 'seller' && user.role === 'user') {
            return res.status(403).json({ 
                error: 'This account is registered as a Buyer. Please sign in via the Buyer portal or register as a Brand Seller.',
                code: 'ROLE_MISMATCH_BUYER'
            });
        }

        if (targetRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ 
                error: 'Access denied: Requires Super Administrator credentials.',
                code: 'ROLE_NOT_ADMIN'
            });
        }

        // Fetch brand details if user is seller/admin
        let brand = null;
        if (user.role === 'seller' || user.role === 'admin' || user.role === 'super_admin') {
            const brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [user.id]);
            brand = brandRes.rows[0] || null;
        }

        const token = jwt.sign(
            { 
                id: user.id,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            },
            brand
        });

    } catch (err) {
        console.error('Error during login:', err);
        const errDetail = err?.stack || err?.message || String(err);
        res.status(500).json({ error: 'Server error during login: ' + errDetail });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1', 
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

export const updateUserProfile = async (req, res) => {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;

    try {
        // 1. If changing email, check if the new email is already in use by someone else
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email is already in use by another account' });
            }
        }

        // 2. Fetch current user data to use as fallback if fields are empty
        const currentUser = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [userId]);
        const currentData = currentUser.rows[0];

        // 3. Update the database
        const updatedUser = await pool.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name), 
                 email = COALESCE($3, email) 
             WHERE id = $4 
             RETURNING id, email, first_name, last_name, role`,
            [
                first_name || currentData.first_name, 
                last_name || currentData.last_name, 
                email || currentData.email, 
                userId
            ]
        );

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser.rows[0]
        });

    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ error: 'Server error while updating profile' });
    }
};


export const updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Please provide both current and new passwords' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    try {
        // 1. Fetch the user's current hashed password from the DB
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // 2. Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // 3. Hash the NEW password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 4. Update the database
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err.message);
        res.status(500).json({ error: 'Server error while updating password' });
    }
};