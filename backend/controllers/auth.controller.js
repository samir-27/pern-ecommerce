import '../env.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const registerUser = async (req, res) => {
    const { email, password, name } = req.body;
    const firstName = req.body.firstName || (name ? name.trim().split(' ')[0] : 'User');
    const lastName = req.body.lastName || (name ? name.trim().split(' ').slice(1).join(' ') : '');

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
        name,
        phone, 
        brandName, 
        website, 
        businessNumber,
        policyReturn,
        policyShipping 
    } = req.body;

    const firstName = req.body.firstName || (name ? name.trim().split(' ')[0] : '');
    const lastName = req.body.lastName || (name ? name.trim().split(' ').slice(1).join(' ') : '');
    const bio = req.body.bio || req.body.brandDescription || '';

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
                business_registration_number, policy_return, policy_shipping, status, commission_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 5.00)
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

        // Also populate backward-compatible seller_stores (inactive until verified)
        await client.query(
            `INSERT INTO seller_stores (id, user_id, name, slug, bio, is_active)
             VALUES ($1, $2, $3, $4, $5, false)
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

        if (user.is_blocked) {
            return res.status(403).json({ 
                error: 'Your account has been suspended by the platform administrator.',
                code: 'USER_BLOCKED'
            });
        }

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
        console.error('Error during login:', err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'The database is unavailable. Start PostgreSQL and try again.'
            });
        }
        res.status(500).json({ error: 'Server error during login. Please try again later.' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1', 
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Fetch user default address
        const addrRes = await pool.query(
            'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC LIMIT 1',
            [req.user.id]
        );

        res.json({
            ...user,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.first_name || 'Client',
            default_address: addrRes.rows[0] || null
        });
    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

const validateIndianMobile = (phone) => {
    if (!phone) return null;
    const digitsOnly = String(phone).replace(/\D/g, '');
    let tenDigit = null;
    if (digitsOnly.length === 10) tenDigit = digitsOnly;
    else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) tenDigit = digitsOnly.slice(1);
    else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) tenDigit = digitsOnly.slice(2);
    
    if (tenDigit && /^[6-9]\d{9}$/.test(tenDigit)) {
        return tenDigit;
    }
    return null;
};

const validateIndianPincode = (pincode) => {
    if (!pincode) return false;
    const cleaned = String(pincode).trim();
    return /^[1-9][0-9]{5}$/.test(cleaned);
};

export const updateUserProfile = async (req, res) => {
    const { first_name, last_name, name, email, phone } = req.body;
    const userId = req.user.id;

    const resolvedFirst = first_name || (name ? name.trim().split(' ')[0] : undefined);
    const resolvedLast = last_name || (name ? name.trim().split(' ').slice(1).join(' ') : undefined);

    try {
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email is already in use by another account' });
            }
        }

        const currentUser = await pool.query('SELECT first_name, last_name, email, phone FROM users WHERE id = $1', [userId]);
        const currentData = currentUser.rows[0] || {};

        let formattedPhone = currentData.phone;
        if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
            const validMobile = validateIndianMobile(phone);
            if (!validMobile) {
                return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' });
            }
            formattedPhone = validMobile;
        } else if (phone === '') {
            formattedPhone = null;
        }

        const updatedUser = await pool.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name), 
                 email = COALESCE($3, email),
                 phone = COALESCE($4, phone),
                 updated_at = NOW()
             WHERE id = $5 
             RETURNING id, email, first_name, last_name, phone, role`,
            [
                resolvedFirst ?? currentData.first_name, 
                resolvedLast ?? currentData.last_name, 
                email || currentData.email, 
                formattedPhone,
                userId
            ]
        );

        const updated = updatedUser.rows[0];
        res.json({
            message: 'Profile updated successfully',
            user: {
                ...updated,
                name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || updated.first_name
            }
        });

    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ error: 'Server error while updating profile' });
    }
};

export const getUserAddresses = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching addresses:', err.message);
        res.status(500).json({ error: 'Failed to fetch saved addresses' });
    }
};

export const createUserAddress = async (req, res) => {
    const fullName = (req.body.fullName || req.body.full_name || '').trim();
    const phone = (req.body.phone || '').trim();
    const address = (req.body.address || req.body.addressLine || req.body.address_line || '').trim();
    const city = (req.body.city || '').trim();
    const state = (req.body.state || '').trim();
    const pincode = (req.body.pincode || req.body.zip || '').trim();
    const isDefault = req.body.isDefault !== undefined ? req.body.isDefault : req.body.is_default;

    if (!fullName || !phone || !address || !city || !pincode) {
        return res.status(400).json({ error: 'Recipient name, phone, address, city, and pincode are required.' });
    }

    const validMobile = validateIndianMobile(phone);
    if (!validMobile) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' });
    }

    if (!validateIndianPincode(pincode)) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code (e.g. 400001).' });
    }

    try {
        const count = await pool.query('SELECT COUNT(*)::int as c FROM user_addresses WHERE user_id = $1', [req.user.id]);
        const shouldBeDefault = Boolean(isDefault) || count.rows[0].c === 0;

        if (shouldBeDefault) {
            await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        }

        const result = await pool.query(
            `INSERT INTO user_addresses (user_id, full_name, phone, address_line, city, state, pincode, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.user.id, fullName, validMobile, address, city, state, pincode, shouldBeDefault]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving address:', err.message);
        res.status(500).json({ error: 'Failed to save address' });
    }
};

export const deleteUserAddress = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Address removed successfully' });
    } catch (err) {
        console.error('Error deleting address:', err.message);
        res.status(500).json({ error: 'Failed to delete address' });
    }
};

export const setDefaultUserAddress = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
        const result = await pool.query(
            'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error setting default address:', err.message);
        res.status(500).json({ error: 'Failed to set default address' });
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