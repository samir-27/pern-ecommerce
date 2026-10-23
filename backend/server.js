import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import adminRoutes from './routes/admin.route.js';
import sellerRoutes from './routes/seller.route.js';
import aiRoutes from './routes/ai.route.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), service: 'MINIMAL. Multi-Vendor Marketplace API' });
});

// Start the server and verify database connection
const server = app.listen(PORT, async () => {
    try {
        await pool.query('SELECT 1'); 
        console.log('Connected to PostgreSQL database');
        console.log(`Server running on http://localhost:${PORT}`);
    } catch (err) {
        console.error('Database connection error', err.stack);
    }
});

export default app;
