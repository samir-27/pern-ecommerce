import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { ApiError } from '../middleware/error.middleware.js';

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export const validateIndianMobile = (phone) => {
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

export const validateIndianPincode = (pincode) => {
    if (!pincode) return false;
    const cleaned = String(pincode).trim();
    return /^[1-9][0-9]{5}$/.test(cleaned);
};

export const generateAuthToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: jwtExpiresIn }
    );
};

export const registerUserService = async ({ email, password, name, firstName: explicitFirst, lastName: explicitLast }) => {
    const firstName = explicitFirst || (name ? name.trim().split(' ')[0] : 'User');
    const lastName = explicitLast || (name ? name.trim().split(' ').slice(1).join(' ') : '');

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        throw new ApiError(400, 'User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role',
        [email, passwordHash, firstName, lastName]
    );

    const user = newUser.rows[0];
    const token = generateAuthToken(user);

    return { user, token };
};

export const registerBrandSellerService = async (data) => {
    const { 
        email, 
        password, 
        name,
        phone, 
        brandName, 
        website, 
        businessNumber,
        policyReturn,
        policyShipping,
        bio: explicitBio,
        brandDescription
    } = data;

    const firstName = data.firstName || (name ? name.trim().split(' ')[0] : '');
    const lastName = data.lastName || (name ? name.trim().split(' ').slice(1).join(' ') : '');
    const bio = explicitBio || brandDescription || '';

    if (!email || !password || !firstName || !brandName) {
        throw new ApiError(400, 'Email, password, personal name, and Brand name are required.');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userExists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            throw new ApiError(400, 'An account with this email already exists');
        }

        const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'brand';
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const salt = await bcrypt.genSalt(10);
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
            `INSERT INTO seller_stores (id, user_id, name, slug, bio, is_active, commission_rate)
             VALUES ($1, $2, $3, $4, $5, false, 5.00)
             ON CONFLICT (id) DO NOTHING`,
            [brand.id, user.id, brand.name, brand.slug, brand.bio]
        );

        await client.query('COMMIT');

        const token = generateAuthToken(user);
        return { user, brand, token };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const loginUserService = async ({ email, password, targetRole }) => {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const user = userResult.rows[0];
    if (user.is_blocked) {
        const err = new ApiError(403, 'Your account has been suspended by the platform administrator.');
        err.details = { code: 'USER_BLOCKED' };
        throw err;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Enforce role-appropriate login routing
    if (targetRole === 'seller' && user.role === 'user') {
        const err = new ApiError(403, 'This account is registered as a Buyer. Please sign in via the Buyer portal or register as a Brand Seller.');
        err.details = { code: 'ROLE_MISMATCH_BUYER' };
        throw err;
    }

    if (targetRole === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
        const err = new ApiError(403, 'Access denied: Requires Super Administrator credentials.');
        err.details = { code: 'ROLE_NOT_ADMIN' };
        throw err;
    }

    // Fetch brand details if user is seller/admin
    let brand = null;
    if (user.role === 'seller' || user.role === 'admin' || user.role === 'super_admin') {
        const brandRes = await pool.query('SELECT * FROM brands WHERE user_id = $1', [user.id]);
        brand = brandRes.rows[0] || null;
    }

    const token = generateAuthToken(user);
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        },
        brand
    };
};

export const getUserProfileService = async (userId) => {
    const userResult = await pool.query(
        'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1', 
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new ApiError(404, 'User not found');
    }

    const user = userResult.rows[0];
    const addrRes = await pool.query(
        'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC LIMIT 1',
        [userId]
    );

    return {
        ...user,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.first_name || 'Client',
        default_address: addrRes.rows[0] || null
    };
};

export const updateUserProfileService = async (userId, data) => {
    const { first_name, last_name, name, email, phone } = data;
    const resolvedFirst = first_name || (name ? name.trim().split(' ')[0] : undefined);
    const resolvedLast = last_name || (name ? name.trim().split(' ').slice(1).join(' ') : undefined);

    if (email) {
        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, userId]
        );
        if (emailCheck.rows.length > 0) {
            throw new ApiError(400, 'Email is already in use by another account');
        }
    }

    const currentUser = await pool.query('SELECT first_name, last_name, email, phone FROM users WHERE id = $1', [userId]);
    const currentData = currentUser.rows[0] || {};

    let formattedPhone = currentData.phone;
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
        const validMobile = validateIndianMobile(phone);
        if (!validMobile) {
            throw new ApiError(400, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
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
    return {
        ...updated,
        name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || updated.first_name
    };
};

export const updateUserPasswordService = async (userId, { currentPassword, newPassword }) => {
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Please provide both current and new passwords');
    }
    if (newPassword.length < 6) {
        throw new ApiError(400, 'New password must be at least 6 characters long');
    }

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new ApiError(404, 'User not found');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
        throw new ApiError(401, 'Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
    return { success: true };
};

export const getUserAddressesService = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
    );
    return result.rows;
};

export const createUserAddressService = async (userId, data) => {
    const fullName = (data.fullName || data.full_name || '').trim();
    const phone = (data.phone || '').trim();
    const address = (data.address || data.addressLine || data.address_line || '').trim();
    const city = (data.city || '').trim();
    const state = (data.state || '').trim();
    const pincode = (data.pincode || data.zip || '').trim();
    const isDefault = data.isDefault !== undefined ? data.isDefault : data.is_default;

    if (!fullName || !phone || !address || !city || !pincode) {
        throw new ApiError(400, 'Recipient name, phone, address, city, and pincode are required.');
    }

    const validMobile = validateIndianMobile(phone);
    if (!validMobile) {
        throw new ApiError(400, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
    }

    if (!validateIndianPincode(pincode)) {
        throw new ApiError(400, 'Please enter a valid 6-digit Indian PIN code (e.g. 400001).');
    }

    const count = await pool.query('SELECT COUNT(*)::int as c FROM user_addresses WHERE user_id = $1', [userId]);
    const shouldBeDefault = Boolean(isDefault) || count.rows[0].c === 0;

    if (shouldBeDefault) {
        await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const result = await pool.query(
        `INSERT INTO user_addresses (user_id, full_name, phone, address_line, city, state, pincode, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, fullName, validMobile, address, city, state, pincode, shouldBeDefault]
    );

    return result.rows[0];
};

export const deleteUserAddressService = async (userId, addressId) => {
    await pool.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    return { success: true };
};

export const setDefaultUserAddressService = async (userId, addressId) => {
    await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
    const result = await pool.query(
        'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [addressId, userId]
    );
    if (result.rows.length === 0) {
        throw new ApiError(404, 'Address not found');
    }
    return result.rows[0];
};
