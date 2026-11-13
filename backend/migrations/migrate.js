import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- Starting Multi-Vendor Migration Runner ---');
    const files = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const client = await pool.connect();
    try {
        for (const file of files) {
            console.log(`Running migration: ${file}...`);
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            await client.query(sql);
            console.log(`✓ Migration ${file} executed successfully.`);
        }

        // Synchronize all serial sequences with MAX(id)
        const seqTables = [
            'users', 'seller_stores', 'brands', 'categories', 'products',
            'product_variants', 'orders', 'seller_orders', 'order_items',
            'seller_applications', 'return_requests', 'reviews', 'audit_logs',
            'user_addresses', 'seller_payouts'
        ];
        for (const tbl of seqTables) {
            try {
                const seq = await client.query("SELECT pg_get_serial_sequence($1, 'id') as seq_name", [tbl]);
                const seqName = seq.rows[0]?.seq_name;
                if (seqName) {
                    const max = await client.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tbl}`);
                    const next = Number(max.rows[0].max_id) + 1;
                    await client.query('SELECT setval($1, $2, false)', [seqName, next]);
                }
            } catch {}
        }

        // Verify tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('Current Database Tables in public schema:');
        console.table(tablesRes.rows);

        // Verify brands
        const brandsRes = await client.query('SELECT id, name, slug, user_id, status FROM brands');
        console.log('Marketplace Brands:');
        console.table(brandsRes.rows);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
