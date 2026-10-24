import pool from '../db.js';

async function seed() {
  try {
    // Check if order items exist
    const countRes = await pool.query('SELECT COUNT(*) FROM order_items');
    if (parseInt(countRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, seller_id, seller_order_id, commission_rate, commission_amount, seller_net_amount, fulfillment_status)
        VALUES 
        (1, 4, 3, 2500.00, 5, 1, 10.00, 750.00, 6750.00, 'delivered'),
        (1, 5, 4, 2500.00, 5, 1, 10.00, 1000.00, 9000.00, 'delivered'),
        (2, 6, 3, 2500.00, 5, 2, 10.00, 750.00, 6750.00, 'delivered'),
        (3, 9, 2, 3000.00, 5, 3, 10.00, 600.00, 5400.00, 'shipped'),
        (3, 12, 8, 1500.00, 5, 3, 10.00, 1200.00, 10800.00, 'shipped')
      `);
      console.log('Successfully seeded order items for orders 1, 2, 3');
    } else {
      console.log('Order items already present:', countRes.rows[0].count);
    }
  } catch (e) {
    console.error('Error seeding order items:', e);
  } finally {
    process.exit(0);
  }
}

seed();
