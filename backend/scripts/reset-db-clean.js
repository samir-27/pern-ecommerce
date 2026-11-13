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

    // 3. Hash Super Admin passwords
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash1 = await bcrypt.hash('Admin@12345', salt);
    const passwordHash2 = await bcrypt.hash('Admin@123', salt);

    console.log('Inserting Super Admin accounts...');
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
      VALUES 
        ('admin@minimal.com', $1, 'Super', 'Admin', 'super_admin', true),
        ('admin@gmail.com', $2, 'Super', 'Admin', 'super_admin', true)
      RETURNING id, email, role;
    `, [passwordHash1, passwordHash2]);

    // 4. Seed Standard Marketplace Categories
    console.log('Seeding standard fashion categories...');
    const defaultCategories = [
      { name: 'Shirts & Tops', description: 'Tailored shirts, casual button-downs, formal shirts, and silk blouses' },
      { name: 'T-Shirts & Polos', description: 'Heavyweight tees, pima cotton crewnecks, textured polos, and henleys' },
      { name: 'Trousers & Pants', description: 'Tailored trousers, pleated chinos, relaxed slacks, and linen pants' },
      { name: 'Jeans & Denim', description: 'Raw selvedge denim, slim taper, straight leg, and vintage washes' },
      { name: 'Suits & Blazers', description: 'Structured blazers, tuxedos, peak-lapel jackets, and tailored suit sets' },
      { name: 'Dresses & Gowns', description: 'Evening gowns, slip dresses, cocktail wear, and draped silk silhouettes' },
      { name: 'Jackets & Outerwear', description: 'Overcoats, wool trench coats, bomber jackets, and winter outerwear' },
      { name: 'Sweaters & Knitwear', description: 'Fine merino knitwear, cashmere cardigans, pullovers, and turtlenecks' },
      { name: 'Activewear & Loungewear', description: 'Lounge sets, French terry hoodies, joggers, and athletic wear' },
      { name: 'Ethnic & Traditional', description: 'Handcrafted kurtas, bandhgalas, sherwanis, and festive apparel' },
      { name: 'Accessories', description: 'Silk neckties, leather belts, scarves, pocket squares, and cuff links' },
    ];

    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING;
      `, [cat.name, cat.description]);
    }

    // 5. Seed Flagship Brand for Super Admin
    await client.query(`
      INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
      VALUES 
        (1, 'MINIMAL Official Store', 'minimal-official', 'Official platform flagship atelier and luxury collection', 'active', 5.00),
        (2, 'Atelier MINIMAL', 'atelier-minimal', 'Contemporary luxury fashion house and premier flagship studio', 'active', 5.00)
      ON CONFLICT DO NOTHING;
    `);

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
