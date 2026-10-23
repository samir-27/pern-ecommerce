import pool from '../db.js';
import { executePrompt } from '../services/ai/aiService.js';

// Feature A: AI Product Listing Assistant
export const productListingAssistant = async (req, res) => {
    const { name, category, gender, fabric, fit, season, bulletPoints } = req.body;

    try {
        const prompt = `
Generate high-converting, professional fashion e-commerce product copy for a clothing item.
Product Draft Name: ${name || 'Casual Fashion Garment'}
Category Hint: ${category || 'Apparel'}
Target Gender: ${gender || 'Unisex'}
Fabric / Material: ${fabric || 'Not specified'}
Fit: ${fit || 'Regular Fit'}
Season: ${season || 'All Season'}
Seller Notes / Bullet Points: ${bulletPoints || 'Modern cut, premium stitching, breathable comfort'}

Return a JSON object with EXACTLY the following keys:
{
  "suggestedTitle": "Catchy, elegant title (under 80 chars)",
  "suggestedDescription": "Comprehensive, stylish description highlighting fit, silhouette, and occasions",
  "seoTitle": "SEO title with brand and keywords (under 60 chars)",
  "seoDescription": "Meta description (under 160 chars)",
  "suggestedCategory": "Single best category name",
  "tags": ["array", "of", "search", "keywords"],
  "careInstructions": "Practical washing, drying, and ironing advice"
}
`;

        const result = await executePrompt({
            prompt,
            systemInstruction: 'You are an expert luxury and streetwear fashion copywriter and SEO specialist. Return valid JSON only. Do not invent unverified organic or fair-trade claims.',
            jsonMode: true,
            userId: req.user.id,
            feature: 'product_assistant'
        });

        res.json(result);
    } catch (err) {
        console.error('Error in product listing assistant:', err.message);
        res.status(500).json({ error: 'Failed to generate product copy' });
    }
};

// Feature B: Conversational Fashion Shopping Assistant
export const shoppingAssistant = async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Please provide a message' });
    }

    try {
        // Step 1: Extract criteria from message using AI
        const extractionPrompt = `
Extract structured fashion shopping search filters from this user message: "${message}".
Return a JSON object with:
{
  "category": null or string matching clothing category like "Shirt", "T-Shirt", "Pants", "Hoodie", "Dress", "Jacket", etc.
  "gender": null or "Mens" or "Womens" or "Unisex",
  "color": null or color name like "Black", "White", "Blue", etc.
  "size": null or size like "S", "M", "L", "XL", "XXL",
  "maxPrice": null or number representing user's upper budget limit,
  "keywords": search string for keywords
}
`;

        const filters = await executePrompt({
            prompt: extractionPrompt,
            systemInstruction: 'You are an intent extraction engine for fashion search. Extract exact parameters into JSON.',
            jsonMode: true,
            userId: req.user?.id || null,
            feature: 'shop_assistant_intent'
        });

        // Step 2: Query REAL PostgreSQL catalog with extracted parameters
        let conditions = ["p.status = 'approved'"];
        let values = [];
        let pIndex = 1;

        if (filters.category) {
            conditions.push(`c.name ILIKE $${pIndex}`);
            values.push(`%${filters.category}%`);
            pIndex++;
        }

        if (filters.gender) {
            conditions.push(`(p.gender = $${pIndex} OR p.gender = 'Unisex')`);
            values.push(filters.gender);
            pIndex++;
        }

        if (filters.maxPrice && Number.isFinite(filters.maxPrice)) {
            conditions.push(`p.base_price <= $${pIndex}`);
            values.push(filters.maxPrice);
            pIndex++;
        }

        if (filters.color) {
            conditions.push(`EXISTS (
                SELECT 1 FROM product_variants v 
                WHERE v.product_id = p.id AND v.color ILIKE $${pIndex}
            )`);
            values.push(`%${filters.color}%`);
            pIndex++;
        }

        if (filters.size) {
            conditions.push(`EXISTS (
                SELECT 1 FROM product_variants v 
                WHERE v.product_id = p.id AND v.size ILIKE $${pIndex}
            )`);
            values.push(`%${filters.size}%`);
            pIndex++;
        }

        if (filters.keywords && filters.keywords.length > 2) {
            conditions.push(`(
                p.name ILIKE $${pIndex} 
                OR coalesce(p.description, '') ILIKE $${pIndex}
                OR coalesce(p.brand, '') ILIKE $${pIndex}
            )`);
            values.push(`%${filters.keywords}%`);
            pIndex++;
        }

        const query = `
            SELECT p.id, p.name, p.base_price, p.gender, p.brand,
                   c.name AS category_name, s.name AS store_name, s.slug AS store_slug,
                   (SELECT v.image_urls[1] FROM product_variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS main_image,
                   (SELECT json_agg(json_build_object('size', v.size, 'color', v.color, 'stock', v.stock_quantity)) 
                    FROM product_variants v WHERE v.product_id = p.id) AS available_variants
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN seller_stores s ON s.id = p.store_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY p.created_at DESC
            LIMIT 6
        `;

        const dbRes = await pool.query(query, values);
        const matchedProducts = dbRes.rows;

        // Step 3: Generate friendly response
        let reply = "";
        if (matchedProducts.length === 0) {
            reply = `I searched our marketplace catalog for "${message}", but couldn't find exact in-stock matches with those filters. You might want to broaden your search or check out our full collection.`;
        } else {
            reply = `I found ${matchedProducts.length} great option${matchedProducts.length > 1 ? 's' : ''} matching your style preferences:`;
        }

        res.json({
            reply,
            products: matchedProducts,
            filtersUsed: filters
        });

    } catch (err) {
        console.error('Error in shopping assistant:', err.message);
        res.status(500).json({ error: 'Shopping assistant encountered an error' });
    }
};

// Feature C: Personalized Product Recommendations
export const getRecommendations = async (req, res) => {
    const userId = req.user?.id;

    try {
        let favoriteCategoryId = null;

        if (userId) {
            // Find user's most frequently purchased category
            const prefRes = await pool.query(`
                SELECT p.category_id, COUNT(*)::int AS count
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                JOIN product_variants pv ON pv.id = oi.variant_id
                JOIN products p ON pv.product_id = p.id
                WHERE o.user_id = $1 AND p.category_id IS NOT NULL
                GROUP BY p.category_id
                ORDER BY count DESC
                LIMIT 1
            `, [userId]);

            if (prefRes.rows.length > 0) {
                favoriteCategoryId = prefRes.rows[0].category_id;
            }
        }

        let recQuery = `
            SELECT p.id, p.name, p.base_price, p.gender, p.brand,
                   c.name AS category_name, s.name AS store_name, s.slug AS store_slug,
                   (SELECT v.image_urls[1] FROM product_variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS main_image
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN seller_stores s ON s.id = p.store_id
            WHERE p.status = 'approved'
        `;

        const values = [];
        if (favoriteCategoryId) {
            recQuery += ` AND p.category_id = $1`;
            values.push(favoriteCategoryId);
        }

        recQuery += ` ORDER BY p.created_at DESC LIMIT 8`;

        let recRes = await pool.query(recQuery, values);

        // Fallback to general approved if no favorite matches
        if (recRes.rows.length === 0 && favoriteCategoryId) {
            const fallbackRes = await pool.query(`
                SELECT p.id, p.name, p.base_price, p.gender, p.brand,
                       c.name AS category_name, s.name AS store_name, s.slug AS store_slug,
                       (SELECT v.image_urls[1] FROM product_variants v WHERE v.product_id = p.id ORDER BY v.id LIMIT 1) AS main_image
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN seller_stores s ON s.id = p.store_id
                WHERE p.status = 'approved'
                ORDER BY p.created_at DESC
                LIMIT 8
            `);
            recRes = fallbackRes;
        }

        res.json({
            title: favoriteCategoryId ? "Curated For Your Style" : "Trending in Marketplace",
            recommendations: recRes.rows
        });
    } catch (err) {
        console.error('Error fetching recommendations:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Feature D: AI Inventory Forecasting & Stockout Predictor (Seller)
export const getInventoryForecast = async (req, res) => {
    const userId = req.user.id;

    try {
        const variantsRes = await pool.query(`
            SELECT pv.id AS variant_id, pv.sku, pv.size, pv.color, pv.stock_quantity, pv.low_stock_threshold,
                   p.name AS product_name, p.base_price,
                   COALESCE(SUM(oi.quantity), 0)::int AS units_sold_all_time,
                   COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at >= NOW() - INTERVAL '30 days'), 0)::int AS units_sold_30d
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN order_items oi ON oi.variant_id = pv.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE p.seller_id = $1
            GROUP BY pv.id, p.name, p.base_price
            ORDER BY pv.stock_quantity ASC
        `, [userId]);

        const forecast = variantsRes.rows.map(item => {
            const dailyVelocity = item.units_sold_30d > 0 ? (item.units_sold_30d / 30) : 0.1;
            const daysRemaining = Math.round(item.stock_quantity / dailyVelocity);

            let riskLevel = 'Low';
            if (item.stock_quantity <= item.low_stock_threshold || daysRemaining <= 7) {
                riskLevel = 'Critical';
            } else if (daysRemaining <= 21) {
                riskLevel = 'Moderate';
            }

            const suggestedReorder = riskLevel === 'Critical' ? Math.max(20, Math.round(dailyVelocity * 45)) : 0;

            return {
                variantId: item.variant_id,
                productName: item.product_name,
                sku: item.sku,
                size: item.size,
                color: item.color,
                currentStock: item.stock_quantity,
                unitsSold30d: item.units_sold_30d,
                estimatedDaysOfRunway: daysRemaining,
                riskLevel,
                suggestedReorderQuantity: suggestedReorder
            };
        });

        res.json({
            forecast,
            totalAssessedVariants: forecast.length,
            criticalCount: forecast.filter(f => f.riskLevel === 'Critical').length
        });

    } catch (err) {
        console.error('Error calculating inventory forecast:', err.message);
        res.status(500).json({ error: 'Server error calculating forecast' });
    }
};

// Feature E: Super Admin AI Analytics Assistant
export const adminAnalyticsAssistant = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        // Collect real DB aggregated data safely
        const [gmvRes, topCategoriesRes, sellerPerformanceRes, stockAlertsRes] = await Promise.all([
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total_orders,
                    COALESCE(SUM(total_amount), 0)::numeric(12,2) AS total_gmv
                FROM orders
            `),
            pool.query(`
                SELECT c.name, COUNT(oi.id)::int AS units_sold, COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)::numeric(12,2) AS category_revenue
                FROM categories c
                JOIN products p ON p.category_id = c.id
                JOIN product_variants pv ON pv.product_id = p.id
                JOIN order_items oi ON oi.variant_id = pv.id
                GROUP BY c.name
                ORDER BY category_revenue DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT s.name, COUNT(so.id)::int AS fulfilled_orders, COALESCE(SUM(so.seller_net_earnings), 0)::numeric(12,2) AS total_earnings
                FROM seller_stores s
                JOIN seller_orders so ON so.store_id = s.id
                GROUP BY s.name
                ORDER BY total_earnings DESC
                LIMIT 5
            `),
            pool.query(`
                SELECT COUNT(*)::int AS low_stock_count
                FROM product_variants pv
                WHERE pv.stock_quantity <= pv.low_stock_threshold
            `)
        ]);

        const dbContext = {
            totalOrders: gmvRes.rows[0]?.total_orders || 0,
            totalGmv: Number(gmvRes.rows[0]?.total_gmv || 0),
            topCategories: topCategoriesRes.rows,
            topSellers: sellerPerformanceRes.rows,
            lowStockItemsCount: stockAlertsRes.rows[0]?.low_stock_count || 0
        };

        const prompt = `
Question from Super Admin: "${question}"

Marketplace Database Metrics:
${JSON.stringify(dbContext, null, 2)}

Provide an accurate, executive-level summary answering the question directly using ONLY the verified metrics above.
Do not hallucinate fake numbers. Format clearly with bullet points.
`;

        const answer = await executePrompt({
            prompt,
            systemInstruction: 'You are an executive marketplace analytics assistant. Answer using only verified metrics.',
            jsonMode: false,
            userId: req.user.id,
            feature: 'admin_analytics'
        });

        res.json({
            question,
            answer,
            dataSnapshot: dbContext
        });

    } catch (err) {
        console.error('Error in admin analytics assistant:', err.message);
        res.status(500).json({ error: 'Failed to process analytics query' });
    }
};

// Feature F: Customer Support Assistant
export const customerSupportAssistant = async (req, res) => {
    const { question } = req.body;
    const userId = req.user?.id;

    try {
        let userOrdersSummary = [];
        if (userId) {
            const ordersRes = await pool.query(`
                SELECT id, total_amount, status, created_at,
                       (SELECT COUNT(*)::int FROM order_items WHERE order_id = orders.id) AS item_count
                FROM orders
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 3
            `, [userId]);
            userOrdersSummary = ordersRes.rows;
        }

        const prompt = `
Customer question: "${question}"

Customer's Recent Order History:
${JSON.stringify(userOrdersSummary, null, 2)}

Marketplace Standard Policies:
- Returns: Customers can submit return requests within 14 days of delivery.
- Shipping: Free shipping on orders over ₹150; standard ₹15 flat shipping for lower amounts.
- Delivery Time: Typically 3 to 5 business days after seller fulfillment.
- Payment: 100% encrypted and verified via Razorpay.

Respond politely and accurately as MINIMAL. Support. If referring to orders, reference their actual order numbers.
`;

        const responseText = await executePrompt({
            prompt,
            systemInstruction: 'You are a warm, professional customer care specialist for MINIMAL. fashion marketplace.',
            jsonMode: false,
            userId,
            feature: 'customer_support'
        });

        res.json({ answer: responseText });

    } catch (err) {
        console.error('Error in support assistant:', err.message);
        res.status(500).json({ error: 'Customer support assistant unavailable' });
    }
};
