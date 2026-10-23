import './env.js';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import adminRoutes from './routes/admin.route.js';
import sellerRoutes from './routes/seller.route.js';
import brandRoutes from './routes/brand.route.js';
import aiRoutes from './routes/ai.route.js';


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
app.use('/api/brand', brandRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), service: 'MINIMAL. Multi-Vendor Marketplace API' });
});

// Root friendly landing
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="margin-bottom: 8px;">MINIMAL. Marketplace API is Online</h1>
            <p style="color: #666; margin-bottom: 24px;">This is the backend API server (port 5000).</p>
            <p>To view the full store and Super Admin dashboard, go to:</p>
            <a href="http://localhost:5173" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Open Storefront & Dashboards (http://localhost:5173)</a>
        </div>
    `);
});

// Start the server and verify database connection
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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
