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

// Feature F: Brand Seller AI Sales & Merchandising Intelligence
export const sellerSalesAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        // Determine brand ID for this seller
        const brandRes = await pool.query('SELECT id, name FROM brands WHERE user_id = $1', [userId]);
        const brandId = brandRes.rows[0]?.id;
        const brandName = brandRes.rows[0]?.name || 'Your Brand';

        // 1. Get recent orders and overall metrics
        const ordersRes = await pool.query(`
            SELECT so.id, so.order_id, so.subtotal, so.commission_amount, so.seller_net_earnings,
                   so.status, so.created_at
            FROM seller_orders so
            WHERE so.seller_id = $1 OR so.brand_id = $2
            ORDER BY so.created_at ASC
        `, [userId, brandId || 0]);

        const orders = ordersRes.rows;
        const totalSales = orders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
        const netEarnings = orders.reduce((sum, o) => sum + Number(o.seller_net_earnings || 0), 0);
        const commissionPaid = orders.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);
        const ordersCount = orders.length;
        const aov = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;

        // 2. Build 14-day daily timeline chart series
        const chartMap = new Map();
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            chartMap.set(dateStr, { date: dateStr, label, sales: 0, earnings: 0, orders: 0 });
        }

        orders.forEach(o => {
            const dateStr = new Date(o.created_at).toISOString().slice(0, 10);
            if (chartMap.has(dateStr)) {
                const entry = chartMap.get(dateStr);
                entry.sales += Number(o.subtotal || 0);
                entry.earnings += Number(o.seller_net_earnings || 0);
                entry.orders += 1;
            }
        });
        const chartData = Array.from(chartMap.values());

        // 3. Top selling garments breakdown
        const itemsRes = await pool.query(`
            SELECT p.name AS product_name, pv.size, pv.color,
                   SUM(oi.quantity)::int AS units_sold,
                   SUM(oi.price_at_purchase * oi.quantity)::numeric(12,2) AS total_revenue
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE oi.seller_id = $1 OR p.brand_id = $2
            GROUP BY p.name, pv.size, pv.color
            ORDER BY total_revenue DESC
            LIMIT 10
        `, [userId, brandId || 0]);

        const topGarments = itemsRes.rows;

        // 4. Run AI Intelligence model via executePrompt
        const prompt = `
Analyze sales and commercial performance for clothing brand "${brandName}":
- Total Sales: ₹${totalSales}
- Net Earnings: ₹${netEarnings}
- Total Orders: ${ordersCount}
- Average Order Value (AOV): ₹${aov}
- Top Performing Products: ${JSON.stringify(topGarments)}
- Recent Daily Revenue Trend: ${JSON.stringify(chartData.filter(c => c.sales > 0))}

Provide an executive JSON analysis with the following fields:
- healthScore: number (0 to 100)
- salesVelocity: string (e.g. "Rapid Expansion", "Steady", "Accelerating")
- executiveSummary: concise string (2-3 sentences)
- topPerformerInsight: concise string analyzing top garment demand
- inventoryForecast: concise string with runout & restock recommendations
- pricingStrategy: concise string on price points and margins
- actionableSteps: array of 3-4 specific high-impact recommendations for the fashion designer / brand owner.
`;

        const aiAnalysis = await executePrompt({
            prompt,
            systemInstruction: 'You are an elite haute-couture fashion commerce analyst and merchandising advisor for luxury and contemporary apparel brands. Return strictly valid JSON.',
            jsonMode: true,
            userId,
            feature: 'brand_sales_analysis'
        });

        res.json({
            brandName,
            metrics: {
                totalSales,
                netEarnings,
                commissionPaid,
                ordersCount,
                aov
            },
            chartData,
            topGarments,
            aiAnalysis
        });

    } catch (err) {
        console.error('Error generating seller sales analysis:', err);
        res.status(500).json({ error: 'Failed to generate AI sales analysis' });
    }
};

// Feature G: Super Admin Platform-Wide AI Sales & Marketplace Analysis
export const adminSalesAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Overall platform numbers
        const [ordersRes, brandDistRes, categoryRes] = await Promise.all([
            pool.query(`
                SELECT id, total_amount, status, created_at
                FROM orders
                ORDER BY created_at ASC
            `),
            pool.query(`
                SELECT b.name AS brand_name,
                       COUNT(so.id)::int AS orders_count,
                       COALESCE(SUM(so.subtotal), 0)::numeric(12,2) AS gross_sales,
                       COALESCE(SUM(so.commission_amount), 0)::numeric(12,2) AS platform_commission
                FROM brands b
                LEFT JOIN seller_orders so ON so.brand_id = b.id
                GROUP BY b.id, b.name
                ORDER BY gross_sales DESC
            `),
            pool.query(`
                SELECT COALESCE(c.name, 'Apparel') AS category_name,
                       COUNT(oi.id)::int AS units_sold,
                       COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)::numeric(12,2) AS revenue
                FROM order_items oi
                JOIN product_variants pv ON oi.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
                ORDER BY revenue DESC
            `)
        ]);

        const allOrders = ordersRes.rows;
        const totalGmv = allOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalCommission = brandDistRes.rows.reduce((sum, b) => sum + Number(b.platform_commission || 0), 0);
        const ordersCount = allOrders.length;
        const aov = ordersCount > 0 ? Math.round(totalGmv / ordersCount) : 0;

        // 2. Build 14-day timeline chart data
        const chartMap = new Map();
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            chartMap.set(dateStr, { date: dateStr, label, gmv: 0, commission: 0, orders: 0 });
        }

        allOrders.forEach(o => {
            const dateStr = new Date(o.created_at).toISOString().slice(0, 10);
            if (chartMap.has(dateStr)) {
                const entry = chartMap.get(dateStr);
                entry.gmv += Number(o.total_amount || 0);
                entry.commission += Number((Number(o.total_amount || 0) * 0.1).toFixed(2));
                entry.orders += 1;
            }
        });
        const chartData = Array.from(chartMap.values());

        const brandDistribution = brandDistRes.rows.map(b => ({
            ...b,
            share: totalGmv > 0 ? Number(((Number(b.gross_sales) / totalGmv) * 100).toFixed(1)) : 0
        }));

        const categoryBreakdown = categoryRes.rows.map(c => ({
            ...c,
            share: totalGmv > 0 ? Number(((Number(c.revenue) / totalGmv) * 100).toFixed(1)) : 0
        }));

        // 3. AI Intelligence prompt
        const prompt = `
Analyze platform-wide e-commerce sales and marketplace growth:
- Total Gross Merchandise Value (GMV): ₹${totalGmv}
- Total Platform Commission Earned: ₹${totalCommission}
- Total Buyer Orders: ${ordersCount}
- Average Order Value: ₹${aov}
- Brand Sales Distribution: ${JSON.stringify(brandDistribution)}
- Category Sales Performance: ${JSON.stringify(categoryBreakdown)}
- 14-Day GMV Trajectory: ${JSON.stringify(chartData.filter(c => c.gmv > 0))}

Provide an executive strategic JSON analysis for the Super Administrator with the following fields:
- healthScore: number (0 to 100)
- marketplaceVelocity: string (e.g. "Rapid Expansion", "High Momentum")
- executiveSummary: concise string (2-3 sentences)
- growthDrivers: concise string explaining key revenue drivers
- vendorConcentrationRisk: concise assessment of brand seller concentration & diversification
- takeRateOptimization: analysis of platform commission rate (10%)
- strategicActionPlan: array of 3-5 high-priority initiatives for marketplace management.
`;

        const aiAnalysis = await executePrompt({
            prompt,
            systemInstruction: 'You are the Chief Strategy Officer and Marketplace Analytics AI for an elite contemporary fashion marketplace. Return strictly valid JSON.',
            jsonMode: true,
            userId,
            feature: 'admin_sales_analysis'
        });

        res.json({
            metrics: {
                totalGmv,
                totalCommission,
                ordersCount,
                aov,
                activeBrandsCount: brandDistribution.filter(b => Number(b.gross_sales) > 0).length
            },
            chartData,
            brandDistribution,
            categoryBreakdown,
            aiAnalysis
        });

    } catch (err) {
        console.error('Error generating admin sales analysis:', err);
        res.status(500).json({ error: 'Failed to generate admin sales analysis' });
    }
};

// Feature H: Brand Seller AI Analytical Chat Assistant
export const sellerChatAssistant = async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Please provide a message' });
    }

    try {
        const userId = req.user.id;

        // Get brand info
        const brandRes = await pool.query(
            'SELECT id, name, commission_rate FROM brands WHERE user_id = $1',
            [userId]
        );
        const brand = brandRes.rows[0];
        const brandId = brand?.id;
        const brandName = brand?.name || 'Independent Atelier';
        const commissionRate = Number(brand?.commission_rate || 10.00);

        // Fetch brand real metrics
        const [ordersRes, itemsRes, inventoryRes] = await Promise.all([
            pool.query(`
                SELECT id, subtotal, commission_amount, seller_net_earnings, status
                FROM seller_orders
                WHERE brand_id = $1 OR seller_id = $2
            `, [brandId || 0, userId]),
            pool.query(`
                SELECT p.name AS product_name, pv.size, pv.color,
                       SUM(oi.quantity)::int AS units_sold,
                       SUM(oi.price_at_purchase * oi.quantity)::numeric(12,2) AS total_revenue
                FROM order_items oi
                JOIN product_variants pv ON oi.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE oi.seller_id = $1 OR p.brand_id = $2
                GROUP BY p.name, pv.size, pv.color
                ORDER BY total_revenue DESC
                LIMIT 5
            `, [userId, brandId || 0]),
            pool.query(`
                SELECT p.name, pv.size, pv.color, pv.stock_quantity
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE p.brand_id = $1 OR p.seller_id = $2
                ORDER BY pv.stock_quantity ASC
                LIMIT 8
            `, [brandId || 0, userId])
        ]);

        const totalOrders = ordersRes.rows.length;
        const grossSales = ordersRes.rows.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
        const commissionPaid = ordersRes.rows.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);
        const netPayout = ordersRes.rows.reduce((sum, o) => sum + Number(o.seller_net_earnings || (Number(o.subtotal || 0) - Number(o.commission_amount || 0))), 0);
        const pendingShipments = ordersRes.rows.filter(o => ['pending', 'processing', 'order_placed', 'confirmed'].includes(o.status)).length;

        const topProducts = itemsRes.rows.map(r => ({
            name: `${r.product_name} (${r.size}/${r.color})`,
            quantity: r.units_sold,
            revenue: Number(r.total_revenue)
        }));

        const lowStockVariants = inventoryRes.rows.map(r => ({
            name: r.name,
            size: r.size,
            color: r.color,
            stock: r.stock_quantity
        }));

        const contextData = {
            brandName,
            grossSales,
            netPayout,
            commissionRate,
            totalOrders,
            pendingShipments,
            topProducts,
            lowStockVariants
        };

        const chatPrompt = `
You are an expert AI fashion merchandising advisor and sales analyst for brand "${brandName}".
You have direct access to real, verified platform metrics for this brand:
- Gross Sales: ₹${grossSales.toLocaleString('en-IN')}
- Platform Commission Rate: ${commissionRate}%
- Total Commission Paid: ₹${commissionPaid.toLocaleString('en-IN')}
- Estimated Net Payout: ₹${netPayout.toLocaleString('en-IN')}
- Total Customer Purchases: ${totalOrders} orders
- Pending Fulfillment / Shipments: ${pendingShipments} orders
- Top Performing Products: ${JSON.stringify(topProducts)}
- Inventory Stock Levels: ${JSON.stringify(lowStockVariants)}

Recent Conversation History:
${history.slice(-4).map(h => `${h.role === 'user' ? 'Seller' : 'AI'}: ${h.content}`).join('\n')}

Seller Question: "${message}"

Instructions:
1. Answer clearly, accurately, and professionally using the verified brand figures above.
2. Format answers with clean markdown headings, bullet points, and highlight currency figures in ₹ (INR).
3. If they ask about sales, revenue, orders, inventory, margins, pricing, or product demand, cite these exact figures.
4. Keep answers concise, actionable, and focused on growing apparel revenue and fulfillment performance.
`;

        const reply = await executePrompt({
            prompt: chatPrompt,
            systemInstruction: 'You are an elite fashion brand business advisor and merchandising AI. Return high-quality, formatted Markdown.',
            jsonMode: false,
            userId,
            feature: 'seller_chat',
            contextData
        });

        res.json({
            reply,
            metrics: {
                brandName,
                grossSales,
                netPayout,
                totalOrders,
                pendingShipments
            }
        });

    } catch (err) {
        console.error('Error in sellerChatAssistant:', err);
        res.status(500).json({ error: 'Failed to process AI chat question' });
    }
};

// Feature I: Super Admin AI Analytical Chat Assistant
export const adminChatAssistant = async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Please provide a message' });
    }

    try {
        const userId = req.user.id;

        // Query platform-wide data
        const [ordersRes, brandsRes, catRes] = await Promise.all([
            pool.query(`SELECT id, total_amount, status, created_at FROM orders`),
            pool.query(`
                SELECT b.name,
                       COUNT(so.id)::int AS orders_count,
                       COALESCE(SUM(so.subtotal), 0)::numeric(12,2) AS gross_sales
                FROM brands b
                LEFT JOIN seller_orders so ON so.brand_id = b.id
                GROUP BY b.id, b.name
                ORDER BY gross_sales DESC
            `),
            pool.query(`
                SELECT COALESCE(c.name, 'Apparel') AS name,
                       COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0)::numeric(12,2) AS revenue
                FROM order_items oi
                JOIN product_variants pv ON oi.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
                ORDER BY revenue DESC
            `)
        ]);

        const totalOrders = ordersRes.rows.length;
        const totalGmv = ordersRes.rows.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const totalCommission = Number((totalGmv * 0.1).toFixed(2));
        const aov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;

        const topBrands = brandsRes.rows.map(b => ({
            name: b.name,
            gross_sales: Number(b.gross_sales),
            orders_count: b.orders_count,
            share: totalGmv > 0 ? Number(((Number(b.gross_sales) / totalGmv) * 100).toFixed(1)) : 0
        }));

        const categories = catRes.rows.map(c => ({
            name: c.name,
            revenue: Number(c.revenue),
            share: totalGmv > 0 ? Number(((Number(c.revenue) / totalGmv) * 100).toFixed(1)) : 0
        }));

        const contextData = {
            totalGmv,
            totalCommission,
            totalOrders,
            aov,
            activeBrandsCount: topBrands.filter(b => b.gross_sales > 0).length,
            topBrands,
            categories
        };

        const chatPrompt = `
You are the Chief Intelligence and Strategy AI for the Super Administrator of the MINIMAL. Fashion Marketplace.
You have direct access to real, verified platform-wide data:
- Platform Gross Merchandise Value (GMV): ₹${totalGmv.toLocaleString('en-IN')}
- Total Platform Commission Earned: ₹${totalCommission.toLocaleString('en-IN')} (Take-rate: 10%)
- Total Customer Purchases: ${totalOrders} orders
- Average Order Value (AOV): ₹${aov.toLocaleString('en-IN')}
- Active Verified Brands: ${contextData.activeBrandsCount}
- Brand Sales Breakdown: ${JSON.stringify(topBrands)}
- Category Sales Breakdown: ${JSON.stringify(categories)}

Recent Conversation History:
${history.slice(-4).map(h => `${h.role === 'user' ? 'Admin' : 'AI'}: ${h.content}`).join('\n')}

Super Admin Question: "${message}"

Instructions:
1. Provide an authoritative, executive-grade analysis citing real platform figures above.
2. Structure answers with clean markdown headings, bullet points, and currency values in ₹ (INR).
3. If asked about platform revenue, take-rates, brand volume shares, category trends, vendor risks, or scaling strategy, ground your answers in these real metrics.
4. Keep answers insightful, strategic, and direct.
`;

        const reply = await executePrompt({
            prompt: chatPrompt,
            systemInstruction: 'You are the Chief Strategy Officer and Marketplace Analytics AI for an elite fashion marketplace. Return high-quality, formatted Markdown.',
            jsonMode: false,
            userId,
            feature: 'admin_chat',
            contextData
        });

        res.json({
            reply,
            metrics: {
                totalGmv,
                totalCommission,
                totalOrders,
                aov,
                activeBrandsCount: contextData.activeBrandsCount
            }
        });

    } catch (err) {
        console.error('Error in adminChatAssistant:', err);
        res.status(500).json({ error: 'Failed to process AI chat question' });
    }
};
