import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/004_user_addresses.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Migration 004 executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
