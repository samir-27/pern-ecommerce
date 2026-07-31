import pool from "../db.js"

export const getCategories = async(req,res) =>{
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC')
        // console.log(result);
        res.json(result.rows);
    } catch (error) {
                console.error('Error fetching categories:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
}

export const getProducts = async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getProductById = async (req, res) => {
    const productId = req.params.id;

    try {
        const productResult = await pool.query(
            `SELECT p.*, c.name as category_name 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        const variantsResult = await pool.query(
            'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY size, color',
            [productId]
        );

        product.variants = variantsResult.rows;

        res.json(product);
        // console.log(product);
    } catch (err) {
        console.error('Error fetching product by ID:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};