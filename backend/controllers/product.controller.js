import pool from "../db.js"

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getProducts = async (req, res) => {
    try {
        const { search, category, gender, color, size } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const offset = (page - 1) * limit;

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        let colorParamIndex = null;
        let sizeParamIndex = null;

        if (category && category !== 'All') {
            conditions.push(`c.name = $${paramIndex}`);
            values.push(category);
            paramIndex++;
        }

        if (gender && gender !== 'All') {
            conditions.push(`p.gender = $${paramIndex}`);
            values.push(gender);
            paramIndex++;
        }

        if (color && color !== "All") {
            colorParamIndex = paramIndex;
            conditions.push(`
                EXISTS (
                    SELECT 1 FROM product_variants v 
                    WHERE v.product_id = p.id 
                    AND LOWER(v.color) = LOWER($${paramIndex})
                )
            `);
            values.push(color);
            paramIndex++;
        }

        if (size && size !== 'All') {
            sizeParamIndex = paramIndex;
            conditions.push(`EXISTS (
                SELECT 1 FROM product_variants v
                WHERE v.product_id = p.id
                AND LOWER(v.size) = LOWER($${paramIndex})
            )`);
            values.push(size);
            paramIndex++;
        }

        if (search) {
            conditions.push(`(
                to_tsvector('english', p.name || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', $${paramIndex})
                OR p.name ILIKE $${paramIndex + 1}
            )`);
            values.push(search);
            values.push(`%${search}%`);
            paramIndex += 2;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';


        const countQuery = `
            SELECT COUNT(p.id)
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const dataQuery = `
            SELECT 
                p.*,
                c.name AS category_name,
                (
                    SELECT v.image_urls[1]
                    FROM product_variants v
                    WHERE v.product_id = p.id
                    ${colorParamIndex ? `AND LOWER(v.color) = LOWER($${colorParamIndex})` : ''}
                    ${sizeParamIndex ? `AND LOWER(v.size) = LOWER($${sizeParamIndex})` : ''}
                    ORDER BY v.id ASC
                    LIMIT 1
                ) AS main_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex}
            OFFSET $${paramIndex + 1}
        `;

        const dataValues = [...values, limit, offset];
        const result = await pool.query(dataQuery, dataValues);

        res.json({
            products: result.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// controllers/productController.js

export const deleteProduct = async (req, res) => {
    const productId = req.params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productResult = await client.query('SELECT category_id FROM products WHERE id = $1', [productId]);
        
        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const categoryId = productResult.rows[0].category_id;

        await client.query('DELETE FROM products WHERE id = $1', [productId]);


        const checkCategory = await client.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [categoryId]);
        

        if (parseInt(checkCategory.rows[0].count) === 0) {
            await client.query('DELETE FROM categories WHERE id = $1', [categoryId]);
            console.log(`Category ${categoryId} is empty and was deleted.`);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Product and empty category cleaned up successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting product:', err.message);
        
        // Handle Foreign Key constraints (if orders exist, we cannot delete the product)
        if (err.code === '23503') {
            res.status(400).json({ error: 'Cannot delete: Product is linked to existing orders.' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    } finally {
        client.release();
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
    } catch (err) {
        console.error('Error fetching product by ID:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createProduct = async (req, res) => {
    const { category_name, name, description, base_price, gender, variants } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const categoryResult = await client.query(
            'SELECT id FROM categories WHERE name = $1',
            [category_name]
        );

        let category_id;

        if (categoryResult.rows.length === 0) {
            const newCategoryResult = await client.query(
                'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
                [category_name, `Autogenerated category for ${category_name}`]
            );
            category_id = newCategoryResult.rows[0].id;
        } else {
            category_id = categoryResult.rows[0].id;
        }

        const productQuery = `
            INSERT INTO products (category_id, name, description, base_price, gender) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const productResult = await client.query(productQuery, [category_id, name, description, base_price, gender || 'Unisex']);
        const newProduct = productResult.rows[0];

        if (variants && variants.length > 0) {
            const insertedVariants = [];
            for (const variant of variants) {
                const variantResult = await client.query(
                    `INSERT INTO product_variants (product_id, sku, size, color, stock_quantity, price_override, image_urls)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING *`,
                    [
                        newProduct.id,
                        variant.sku,
                        variant.size,
                        variant.color,
                        variant.stock_quantity,
                        variant.price_override || null,
                        variant.image_urls || []
                    ]
                );
                insertedVariants.push(variantResult.rows[0]);
            }

            newProduct.variants = insertedVariants;
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating product:', err.message);
        res.status(500).json({ error: 'Server error during product creation' });
    } finally {
        client.release();
    }
};

export const getColors = async (req, res) => {
    try {
        // FIX: Use length() instead of != '' for safer Postgres string evaluation
        const result = await pool.query(`
            SELECT DISTINCT color 
            FROM product_variants 
            WHERE color IS NOT NULL AND length(TRIM(color)) > 0
            ORDER BY color ASC
        `);

        const colors = result.rows.map(row => row.color);
        res.json(colors);
    } catch (err) {
        console.error('Error fetching colors:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};