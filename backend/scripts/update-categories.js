import pool from '../db.js';

async function updateClothingCategories() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const clothingCategories = [
      { id: 1, name: 'Shirts & Tops', description: 'Tailored shirts, casual button-downs, formal shirts, and silk blouses' },
      { id: 2, name: 'T-Shirts & Polos', description: 'Heavyweight tees, pima cotton crewnecks, textured polos, and henleys' },
      { id: 3, name: 'Trousers & Pants', description: 'Tailored trousers, pleated chinos, relaxed slacks, and linen pants' },
      { id: 4, name: 'Jeans & Denim', description: 'Raw selvedge denim, slim taper, straight leg, and vintage washes' },
      { id: 5, name: 'Suits & Blazers', description: 'Structured blazers, tuxedos, peak-lapel jackets, and tailored suit sets' },
      { id: 6, name: 'Dresses & Gowns', description: 'Evening gowns, slip dresses, cocktail wear, and draped silk silhouettes' },
      { id: 7, name: 'Jackets & Outerwear', description: 'Overcoats, wool trench coats, bomber jackets, and winter outerwear' },
      { id: 8, name: 'Sweaters & Knitwear', description: 'Fine merino knitwear, cashmere cardigans, pullovers, and turtlenecks' },
      { id: 9, name: 'Activewear & Loungewear', description: 'Lounge sets, French terry hoodies, joggers, and athletic wear' },
      { id: 10, name: 'Ethnic & Traditional', description: 'Handcrafted kurtas, bandhgalas, sherwanis, and festive apparel' },
      { id: 11, name: 'Accessories', description: 'Silk neckties, leather belts, scarves, pocket squares, and cuff links' }
    ];

    for (const c of clothingCategories) {
      await client.query(
        `INSERT INTO categories (id, name, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
        [c.id, c.name, c.description]
      );
    }
    
    await client.query(`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`);

    // Re-map existing products to accurate clothing categories
    // Product 1: Tailored Linen Blazer -> Suits & Blazers (id: 5)
    await client.query(`UPDATE products SET category_id = 5 WHERE id = 1`);
    // Product 2: Raymond Men Blue Slim Fit Solid Formal Shirt -> Shirts & Tops (id: 1)
    await client.query(`UPDATE products SET category_id = 1 WHERE id = 2`);
    // Product 3: Silk Charmeuse Evening Gown -> Dresses & Gowns (id: 6)
    await client.query(`UPDATE products SET category_id = 6 WHERE id = 3`);

    await client.query('COMMIT');
    console.log('Categories successfully updated to clothing brand categories!');
    const check = await client.query('SELECT * FROM categories ORDER BY id ASC');
    console.log(check.rows);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Error updating categories:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateClothingCategories();
