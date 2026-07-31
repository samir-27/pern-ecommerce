import pool from '../db.js';

export const createOrder = async (req, res) => {
    const { orderItems, shippingAddress } = req.body;
    const userId = req.user.id

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ error: 'No order items' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let calculatedTotal = 0;
        const validOrderItems = [];

        for (const item of orderItems) {
            const variantResult = await client.query(
                `SELECT pv.stock_quantity, pv.price_override, p.base_price 
                 FROM product_variants pv
                 JOIN products p ON pv.product_id = p.id
                 WHERE pv.id = $1`,
                [item.variant_id]
            );

            if (variantResult.rows.length === 0) {
                throw new Error(`Variant ID ${item.variant_id} not found.`);
            }

            const variant = variantResult.rows[0];

            if (variant.stock_quantity < item.quantity) {
                throw new Error(`Not enough stock for item ID ${item.variant_id}`);
            }

            const truePrice = variant.price_override ? variant.price_override : variant.base_price;
            
            calculatedTotal += (truePrice * item.quantity);

            validOrderItems.push({
                variant_id: item.variant_id,
                quantity: item.quantity,
                price_at_purchase: truePrice
            });
        }

        const orderResult = await client.query(
            `INSERT INTO orders (user_id, total_amount, shipping_address)
             VALUES ($1, $2, $3)
             RETURNING id, total_amount, status, created_at`,
            [userId, calculatedTotal, shippingAddress]
        );
        const newOrder = orderResult.rows[0];

        for (const validItem of validOrderItems) {
                
            await client.query(
                `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, $4)`,
                [newOrder.id, validItem.variant_id, validItem.quantity, validItem.price_at_purchase]
            );

            await client.query(
                `UPDATE product_variants 
                 SET stock_quantity = stock_quantity - $1 
                 WHERE id = $2`,
                [validItem.quantity, validItem.variant_id]
            );
        }

        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Checkout Error:', err.message);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};


export const getMyOrders = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};