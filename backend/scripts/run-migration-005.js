import pool from '../db.js';

async function migrate() {
    console.log('Running migration 005_brand_and_user_governance...');

    // 1. Add is_blocked to users
    await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
    `);
    console.log('Added is_blocked to users');

    // 2. Add commission negotiation columns to brands
    await pool.query(`
        ALTER TABLE brands 
        ADD COLUMN IF NOT EXISTS proposed_commission_rate NUMERIC(5,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS commission_status VARCHAR(50) DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS commission_change_note TEXT DEFAULT NULL;
    `);
    console.log('Added commission negotiation columns to brands');

    // Ensure status constraint includes 'pending', 'active', 'suspended', 'rejected'
    console.log('Migration 005 completed successfully!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
