import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- Starting Multi-Vendor Migration ---');
    const sqlPath = path.join(__dirname, '001_multivendor_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✓ Migration 001_multivendor_init.sql executed successfully.');

        // Verify tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('Current Database Tables in public schema:');
        console.table(tablesRes.rows);

        // Verify default store
        const storeRes = await client.query('SELECT id, name, slug, user_id FROM seller_stores');
        console.log('Seller Stores:');
        console.table(storeRes.rows);

        // Verify commission rules
        const rulesRes = await client.query('SELECT * FROM commission_rules');
        console.log('Commission Rules:');
        console.table(rulesRes.rows);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
