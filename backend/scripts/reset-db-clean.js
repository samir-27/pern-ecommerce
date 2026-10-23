import pool from '../db.js';
import bcrypt from 'bcrypt';

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    await client.query('BEGIN');

    // 1. Get all table names in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log('Found tables to clear:', tableNames);

    // 2. Truncate all tables with CASCADE
    if (tableNames.length > 0) {
      const truncateList = tableNames.map(t => `"${t}"`).join(', ');
      console.log(`Truncating all tables with RESTART IDENTITY CASCADE...`);
      await client.query(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE;`);
    }

    // 3. Hash Super Admin password
    const adminEmail = 'admin@minimal.com';
    const rawPassword = 'Admin@12345';
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    console.log('Inserting Super Admin account (admin@minimal.com)...');
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
      VALUES ($1, $2, 'Super', 'Admin', 'super_admin', true)
      RETURNING id, email, role;
    `, [adminEmail, passwordHash]);

    // 4. Seed Standard Marketplace Categories
    console.log('Seeding standard fashion categories...');
    const defaultCategories = [
      { name: 'Tops', description: 'Shirts, T-shirts, Polos, Blouses, Knit Tops' },
      { name: 'Bottoms', description: 'Trousers, Chinos, Denim, Skirts, Tailored Pants' },
      { name: 'Outerwear', description: 'Coats, Blazers, Trench Coats, Jackets' },
      { name: 'Dresses', description: 'Cocktail dresses, Evening gowns, Sundresses' },
      { name: 'Knitwear', description: 'Cashmere sweaters, Cardigans, Wool pullovers' },
      { name: 'Footwear', description: 'Loafers, Chelsea boots, Minimalist sneakers, Derbies' },
      { name: 'Accessories', description: 'Belts, Leather bags, Scarves, Fine jewelry' },
    ];

    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING;
      `, [cat.name, cat.description]);
    }

    await client.query('COMMIT');
    console.log('\n=============================================');
    console.log('DATABASE RESET COMPLETE!');
    console.log('Every table was emptied and sequence IDs reset.');
    console.log('Categories seeded: 7 standard apparel categories.');
    console.log('Single account preserved:');
    console.log('Email:    admin@minimal.com');
    console.log('Password: Admin@12345');
    console.log('Role:     super_admin');
    console.log('=============================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error resetting database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
