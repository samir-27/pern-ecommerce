import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

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
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
            [email, passwordHash, firstName, lastName]
        );

        const token = jwt.sign(
            { id: newUser.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
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

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ error: 'Server error during login' });
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