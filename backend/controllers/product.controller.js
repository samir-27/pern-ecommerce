import pool from "../db.js"
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadProductImages = upload.array('images', 25);

const uploadToCloudinary = async (file) => {
    if (!file) return null;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'ecommerce/products' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result?.secure_url || null);
            }
        );

        stream.end(file.buffer);
    });
};

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

export const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, category_name, description, base_price, gender } = req.body;
    const productName = typeof name === 'string' ? name.trim() : '';
    const parsedBasePrice = Number(base_price);

    if (!productName || !Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
        return res.status(400).json({ error: 'A product name and valid non-negative price are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const currentResult = await client.query(
            'SELECT category_id FROM products WHERE id = $1 FOR UPDATE',
            [productId]
        );

        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        let categoryId = currentResult.rows[0].category_id;
        if (typeof category_name === 'string' && category_name.trim()) {
            const categoryResult = await client.query(
                'SELECT id FROM categories WHERE name = $1',
                [category_name.trim()]
            );

            if (categoryResult.rows.length > 0) {
                categoryId = categoryResult.rows[0].id;
            } else {
                const newCategoryResult = await client.query(
                    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
                    [category_name.trim(), `Autogenerated category for ${category_name.trim()}`]
                );
                categoryId = newCategoryResult.rows[0].id;
            }
        }

        const result = await client.query(
            `UPDATE products
             SET name = $1, category_id = $2, description = $3, base_price = $4, gender = $5
             WHERE id = $6
             RETURNING *`,
            [productName, categoryId, description ?? '', parsedBasePrice, gender || 'Unisex', productId]
        );

        await client.query('COMMIT');
        res.json({ message: 'Product updated successfully', product: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating product:', err.message);
        res.status(500).json({ error: 'Server error updating product' });
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
    const { category_name, name, description, base_price, gender, variants, variantImageCounts } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const categoryName = category_name || 'General';
        const categoryResult = await client.query(
            'SELECT id FROM categories WHERE name = $1',
            [categoryName]
        );

        let category_id;

        if (categoryResult.rows.length === 0) {
            const newCategoryResult = await client.query(
                'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
                [categoryName, `Autogenerated category for ${categoryName}`]
            );
            category_id = newCategoryResult.rows[0].id;
        } else {
            category_id = categoryResult.rows[0].id;
        }

        const parsedBasePrice = parseFloat(base_price);
        const productQuery = `
            INSERT INTO products (category_id, name, description, base_price, gender) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const productResult = await client.query(productQuery, [category_id, name, description, parsedBasePrice, gender || 'Unisex']);
        const newProduct = productResult.rows[0];

        const parsedVariants = variants ? JSON.parse(variants) : [];
        const parsedImageCounts = variantImageCounts ? JSON.parse(variantImageCounts) : [];
        const variantList = Array.isArray(parsedVariants) && parsedVariants.length > 0
            ? parsedVariants
            : [{ sku: `SKU-${Date.now()}`, size: 'One Size', color: 'Default', stock_quantity: 10, price_override: null }];

        const uploadedFiles = Array.isArray(req.files) ? req.files : [];
        let fileIndex = 0;
        const insertedVariants = [];

        for (let index = 0; index < variantList.length; index++) {
            const variant = variantList[index];
            const count = Number(parsedImageCounts[index] || 0);
            const filesForVariant = uploadedFiles.slice(fileIndex, fileIndex + count);
            fileIndex += count;

            const imageUrls = [];
            for (const file of filesForVariant) {
                const uploadedUrl = await uploadToCloudinary(file);
                if (uploadedUrl) imageUrls.push(uploadedUrl);
            }

            const variantResult = await client.query(
                `INSERT INTO product_variants (product_id, sku, size, color, stock_quantity, price_override, image_urls)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    newProduct.id,
                    variant.sku || `SKU-${Date.now()}-${index + 1}`,
                    variant.size || 'One Size',
                    variant.color || 'Default',
                    parseInt(variant.stock_quantity || 10, 10),
                    variant.price_override ? parseFloat(variant.price_override) : null,
                    imageUrls
                ]
            );
            insertedVariants.push(variantResult.rows[0]);
        }

        newProduct.variants = insertedVariants;

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

export const getProductReviews = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.rating, r.content, r.created_at,
                    COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS username
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.product_id = $1
             ORDER BY r.created_at DESC`,
            [req.params.id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching product reviews:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createProductReview = async (req, res) => {
    const { rating, content } = req.body;
    const numericRating = Number(rating);
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
    }

    if (!trimmedContent || trimmedContent.length > 2000) {
        return res.status(400).json({ error: 'Review content must be between 1 and 2000 characters' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reviews (product_id, user_id, rating, content)
             SELECT $1, $2, $3, $4
             WHERE EXISTS (SELECT 1 FROM products WHERE id = $1)
             RETURNING id, rating, content, created_at`,
            [req.params.id, req.user.id, numericRating, trimmedContent]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const review = await pool.query(
            `SELECT r.id, r.rating, r.content, r.created_at,
                    COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) AS username
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(review.rows[0]);
    } catch (err) {
        console.error('Error creating product review:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};