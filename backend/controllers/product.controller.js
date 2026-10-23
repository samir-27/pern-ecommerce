import pool from "../db.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { logAuditEvent } from '../utils/auditLogger.js';

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

    // Check if Cloudinary is configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName.includes('your_') || !process.env.CLOUDINARY_API_KEY) {
        // Fallback for local/testing if Cloudinary credentials are mock
        return `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80`;
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'ecommerce/products' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary error, falling back:', error.message);
                    return resolve(`https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80`);
                }
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
        const { search, category, gender, color, size, brand, clothing_type, season, store_slug, minPrice, maxPrice } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const offset = (page - 1) * limit;

        // Default: only approved products for the public catalog
        let conditions = ["p.status = 'approved'"];
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

        if (brand && brand !== 'All') {
            conditions.push(`p.brand ILIKE $${paramIndex}`);
            values.push(brand);
            paramIndex++;
        }

        if (clothing_type && clothing_type !== 'All') {
            conditions.push(`p.clothing_type ILIKE $${paramIndex}`);
            values.push(clothing_type);
            paramIndex++;
        }

        if (season && season !== 'All') {
            conditions.push(`p.season ILIKE $${paramIndex}`);
            values.push(season);
            paramIndex++;
        }

        if (minPrice && !isNaN(minPrice)) {
            conditions.push(`p.base_price >= $${paramIndex}`);
            values.push(Number(minPrice));
            paramIndex++;
        }

        if (maxPrice && !isNaN(maxPrice)) {
            conditions.push(`p.base_price <= $${paramIndex}`);
            values.push(Number(maxPrice));
            paramIndex++;
        }

        if (store_slug) {
            conditions.push(`s.slug = $${paramIndex}`);
            values.push(store_slug);
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
                to_tsvector('english', p.name || ' ' || coalesce(p.description, '') || ' ' || coalesce(p.brand, '')) @@ plainto_tsquery('english', $${paramIndex})
                OR p.name ILIKE $${paramIndex + 1}
                OR coalesce(p.brand, '') ILIKE $${paramIndex + 1}
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
            LEFT JOIN seller_stores s ON p.store_id = s.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const dataQuery = `
            SELECT 
                p.*,
                c.name AS category_name,
                s.name AS store_name,
                s.slug AS store_slug,
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
            LEFT JOIN seller_stores s ON p.store_id = s.id
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

export const deleteProduct = async (req, res) => {
    const productId = req.params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productResult = await client.query('SELECT category_id, seller_id FROM products WHERE id = $1', [productId]);

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        // Tenant isolation: Sellers can only delete their own products
        if (req.user.role === 'seller' && product.seller_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Not authorized to delete this product' });
        }

        await client.query('DELETE FROM products WHERE id = $1', [productId]);

        const checkCategory = await client.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [product.category_id]);
        if (parseInt(checkCategory.rows[0].count) === 0) {
            await client.query('DELETE FROM categories WHERE id = $1', [product.category_id]);
        }

        await logAuditEvent({
            userId: req.user.id,
            action: 'PRODUCT_DELETED',
            targetEntity: 'products',
            targetId: Number(productId),
            details: { category_id: product.category_id }
        });

        await client.query('COMMIT');
        res.status(200).json({ message: 'Product cleaned up successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting product:', err.message);

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
    const {
        name, category_name, description, base_price, gender,
        brand, clothing_type, fabric_material, fit, pattern, season, care_instructions
    } = req.body;

    const productName = typeof name === 'string' ? name.trim() : '';
    const parsedBasePrice = Number(base_price);

    if (!productName || !Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
        return res.status(400).json({ error: 'A product name and valid non-negative price are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const currentResult = await client.query(
            'SELECT category_id, seller_id FROM products WHERE id = $1 FOR UPDATE',
            [productId]
        );

        if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        const currentProduct = currentResult.rows[0];

        // Tenant isolation: Sellers can only edit their own products
        if (req.user.role === 'seller' && currentProduct.seller_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Not authorized to update this product' });
        }

        let categoryId = currentProduct.category_id;
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
             SET name = $1, category_id = $2, description = $3, base_price = $4, gender = $5,
                 brand = COALESCE($6, brand),
                 clothing_type = COALESCE($7, clothing_type),
                 fabric_material = COALESCE($8, fabric_material),
                 fit = COALESCE($9, fit),
                 pattern = COALESCE($10, pattern),
                 season = COALESCE($11, season),
                 care_instructions = COALESCE($12, care_instructions)
             WHERE id = $13
             RETURNING *`,
            [
                productName, categoryId, description ?? '', parsedBasePrice, gender || 'Unisex',
                brand || null, clothing_type || null, fabric_material || null, fit || null,
                pattern || null, season || null, care_instructions || null, productId
            ]
        );

        await logAuditEvent({
            userId: req.user.id,
            action: 'PRODUCT_UPDATED',
            targetEntity: 'products',
            targetId: Number(productId),
            details: { name: productName, base_price: parsedBasePrice }
        });

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
            `SELECT p.*, c.name as category_name,
                    s.name as store_name, s.slug as store_slug, s.logo_url as store_logo,
                    s.policy_return as store_return_policy, s.policy_shipping as store_shipping_policy
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN seller_stores s ON p.store_id = s.id
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
    const {
        category_name, name, description, base_price, gender,
        brand, clothing_type, fabric_material, fit, pattern, season, care_instructions,
        variants, variantImageCounts
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Resolve seller and store
        let sellerId = req.user.id;
        let storeId = null;

        const storeRes = await client.query('SELECT id FROM seller_stores WHERE user_id = $1', [sellerId]);
        if (storeRes.rows.length > 0) {
            storeId = storeRes.rows[0].id;
        } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            // Admin fallback to default store 1
            const defaultStore = await client.query('SELECT id, user_id FROM seller_stores LIMIT 1');
            if (defaultStore.rows.length > 0) {
                storeId = defaultStore.rows[0].id;
            }
        }

        // Product status: 'approved' for admin/super_admin; 'pending_approval' for sellers
        const productStatus = (req.user.role === 'admin' || req.user.role === 'super_admin') ? 'approved' : 'pending_approval';

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
            INSERT INTO products (
                category_id, name, description, base_price, gender,
                seller_id, store_id, brand, clothing_type, fabric_material,
                fit, pattern, season, care_instructions, status
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *
        `;
        const productResult = await client.query(productQuery, [
            category_id, name, description, parsedBasePrice, gender || 'Unisex',
            sellerId, storeId, brand || null, clothing_type || null, fabric_material || null,
            fit || null, pattern || null, season || null, care_instructions || null, productStatus
        ]);
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

            // Fallback sample image if none provided
            if (imageUrls.length === 0) {
                imageUrls.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80');
            }

            const variantResult = await client.query(
                `INSERT INTO product_variants (
                    product_id, sku, size, color, stock_quantity,
                    price_override, compare_at_price, low_stock_threshold, image_urls
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    newProduct.id,
                    variant.sku || `SKU-${Date.now()}-${index + 1}`,
                    variant.size || 'One Size',
                    variant.color || 'Default',
                    parseInt(variant.stock_quantity || 10, 10),
                    variant.price_override ? parseFloat(variant.price_override) : null,
                    variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                    parseInt(variant.low_stock_threshold || 5, 10),
                    imageUrls
                ]
            );
            insertedVariants.push(variantResult.rows[0]);
        }

        newProduct.variants = insertedVariants;

        await logAuditEvent({
            userId: req.user.id,
            action: 'PRODUCT_CREATED',
            targetEntity: 'products',
            targetId: newProduct.id,
            details: { name: newProduct.name, status: productStatus, storeId }
        });

        await client.query('COMMIT');

        res.status(201).json({
            message: productStatus === 'approved' ? 'Product created successfully' : 'Product submitted for Super Admin approval',
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
