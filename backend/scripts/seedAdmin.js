import bcrypt from 'bcrypt';
import pool from '../db.js';

async function seedAdmin() {
    try {
        const email = 'admin@minimal.com';
        const password = 'Admin@12345';
        const hash = await bcrypt.hash(password, 10);

        const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, 'admin', email]);
            console.log('Successfully updated Super Admin account (admin@minimal.com)');
        } else {
            await pool.query(
                'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5)',
                [email, hash, 'Super', 'Admin', 'admin']
            );
            console.log('Successfully created Super Admin account (admin@minimal.com)');
        }

        // Also reset sumrasamir27@gmail.com with the same password so the owner's account works
        const checkOwner = await pool.query('SELECT id FROM users WHERE email = $1', ['sumrasamir27@gmail.com']);
        if (checkOwner.rows.length > 0) {
            await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, 'admin', 'sumrasamir27@gmail.com']);
            console.log('Successfully updated primary owner account (sumrasamir27@gmail.com)');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

seedAdmin();
