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
