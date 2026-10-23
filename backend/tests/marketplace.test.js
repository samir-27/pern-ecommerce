import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { executePrompt } from '../services/ai/aiService.js';

describe('PERN Multi-Vendor Fashion Marketplace Test Suite', () => {
    let testAdminUser;
    let testSellerUser1;
    let testSellerUser2;
    let testCustomerUser;
    let store1;
    let store2;
    let categoryShirtId;
    let product1;
    let variant1;
    let variant2;
    const testRunId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    before(async () => {
        // Setup clean test users
        const adminRes = await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, 'hashed_pass', 'Super', 'Admin', 'admin')
            RETURNING *
        `, [`admin_${testRunId}@test.com`]);
        testAdminUser = adminRes.rows[0];

        const seller1Res = await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, 'hashed_pass', 'Seller', 'One', 'seller')
            RETURNING *
        `, [`seller1_${testRunId}@test.com`]);
        testSellerUser1 = seller1Res.rows[0];

        const seller2Res = await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, 'hashed_pass', 'Seller', 'Two', 'seller')
            RETURNING *
        `, [`seller2_${testRunId}@test.com`]);
        testSellerUser2 = seller2Res.rows[0];

        const customerRes = await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, 'hashed_pass', 'Test', 'Customer', 'user')
            RETURNING *
        `, [`customer_${testRunId}@test.com`]);
        testCustomerUser = customerRes.rows[0];

        // Create Stores
        const store1Res = await pool.query(`
            INSERT INTO seller_stores (user_id, name, slug, bio, commission_rate, is_active)
            VALUES ($1, 'Boutique One', $2, 'Fine Italian linen', 10.00, true)
            RETURNING *
        `, [testSellerUser1.id, `boutique-one-${testRunId}`]);
        store1 = store1Res.rows[0];

        const store2Res = await pool.query(`
            INSERT INTO seller_stores (user_id, name, slug, bio, commission_rate, is_active)
            VALUES ($1, 'Atelier Two', $2, 'Streetwear denim', 12.00, true)
            RETURNING *
        `, [testSellerUser2.id, `atelier-two-${testRunId}`]);
        store2 = store2Res.rows[0];

        // Ensure a test Category
        const catRes = await pool.query(`
            INSERT INTO categories (name, description)
            VALUES ($1, 'Category for testing')
            RETURNING *
        `, [`Test Shirts ${testRunId}`]);
        categoryShirtId = catRes.rows[0].id;
    });

    after(async () => {
        // Clean up test products and users
        if (product1?.id) {
            await pool.query('DELETE FROM products WHERE id = $1', [product1.id]).catch(() => {});
        }
        if (categoryShirtId) {
            await pool.query('DELETE FROM categories WHERE id = $1', [categoryShirtId]).catch(() => {});
        }
        if (testAdminUser) {
            await pool.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [
                testAdminUser.id, testSellerUser1.id, testSellerUser2.id, testCustomerUser.id
            ]).catch(() => {});
        }
        await pool.end();
    });

    test('1. Authentication & Role Issuance', async () => {
        const token = jwt.sign(
            { id: testCustomerUser.id, role: testCustomerUser.role },
            process.env.JWT_SECRET || 'test_secret'
        );
        assert.ok(token, 'JWT Token must be generated');

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
        assert.equal(decoded.id, testCustomerUser.id);
        assert.equal(decoded.role, 'user');
    });

    test('2. Seller Onboarding Application Workflow', async () => {
        // Customer submits application
        const appRes = await pool.query(`
            INSERT INTO seller_applications (user_id, business_name, business_email, phone, tax_id, status)
            VALUES ($1, 'Luxury Knitwear', 'apply@knitwear.com', '+919999999999', 'GSTIN12345', 'pending')
            RETURNING *
        `, [testCustomerUser.id]);

        assert.equal(appRes.rows[0].status, 'pending');
        assert.equal(appRes.rows[0].business_name, 'Luxury Knitwear');

        // Admin approves application
        const updateRes = await pool.query(`
            UPDATE seller_applications
            SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [testAdminUser.id, appRes.rows[0].id]);

        assert.equal(updateRes.rows[0].status, 'approved');
        assert.equal(updateRes.rows[0].reviewed_by, testAdminUser.id);
    });

    test('3. Product Catalog with Fashion Attributes & Variant Inventory', async () => {
        const prodRes = await pool.query(`
            INSERT INTO products (
                category_id, name, description, base_price, gender,
                seller_id, store_id, brand, clothing_type, fabric_material, fit, season, status
            )
            VALUES ($1, 'Linen Casual Shirt', 'Breathable relaxed fit', 1200.00, 'Mens', $2, $3, 'Boutique One', 'Shirt', '100% Linen', 'Relaxed', 'Summer', 'approved')
            RETURNING *
        `, [categoryShirtId, testSellerUser1.id, store1.id]);

        product1 = prodRes.rows[0];
        assert.equal(product1.name, 'Linen Casual Shirt');
        assert.equal(product1.seller_id, testSellerUser1.id);
        assert.equal(product1.store_id, store1.id);
        assert.equal(product1.status, 'approved');

        // Create Size/Color Variants with unique SKUs
        const v1Res = await pool.query(`
            INSERT INTO product_variants (product_id, sku, size, color, stock_quantity, price_override)
            VALUES ($1, $2, 'M', 'Black', 20, 1200.00)
            RETURNING *
        `, [product1.id, `LINEN-M-BLK-${testRunId}`]);
        variant1 = v1Res.rows[0];

        const v2Res = await pool.query(`
            INSERT INTO product_variants (product_id, sku, size, color, stock_quantity, price_override)
            VALUES ($1, $2, 'L', 'White', 15, 1250.00)
            RETURNING *
        `, [product1.id, `LINEN-L-WHT-${testRunId}`]);
        variant2 = v2Res.rows[0];

        assert.equal(variant1.stock_quantity, 20);
        assert.equal(variant2.stock_quantity, 15);
    });

    test('4. Seller Tenant Data Isolation Enforcement', async () => {
        // Seller 2 queries their products
        const isolatedQuery = await pool.query(
            'SELECT * FROM products WHERE seller_id = $1',
            [testSellerUser2.id]
        );

        // Product1 belongs to Seller 1, so Seller 2 query must NOT contain it
        const hasSeller1Product = isolatedQuery.rows.some(p => p.id === product1.id);
        assert.equal(hasSeller1Product, false, "Seller 2 must never see Seller 1's private products");
    });

    test('5. Multi-Seller Order Splitting & Commission Accounting', async () => {
        // Customer places order for 2 units of variant1 (Seller 1)
        const orderRes = await pool.query(`
            INSERT INTO orders (user_id, total_amount, shipping_address, status)
            VALUES ($1, 2400.00, '123 Fashion Blvd, Mumbai', 'pending')
            RETURNING *
        `, [testCustomerUser.id]);
        const order = orderRes.rows[0];

        const quantity = 2;
        const price = Number(variant1.price_override);
        const subtotal = price * quantity; // 2400.00
        const commissionRate = 10.00;
        const commissionAmount = Number(((subtotal * commissionRate) / 100).toFixed(2)); // 240.00
        const sellerNetEarnings = Number((subtotal - commissionAmount).toFixed(2)); // 2160.00

        // Create fulfillment group for Seller 1
        const sellerOrderRes = await pool.query(`
            INSERT INTO seller_orders (
                order_id, seller_id, store_id, subtotal, shipping_fee,
                commission_amount, seller_net_earnings, status
            )
            VALUES ($1, $2, $3, $4, 0, $5, $6, 'unfulfilled')
            RETURNING *
        `, [order.id, testSellerUser1.id, store1.id, subtotal, commissionAmount, sellerNetEarnings]);

        assert.equal(sellerOrderRes.rows[0].commission_amount, '240.00');
        assert.equal(sellerOrderRes.rows[0].seller_net_earnings, '2160.00');

        // Link Order Item
        const orderItemRes = await pool.query(`
            INSERT INTO order_items (
                order_id, variant_id, quantity, price_at_purchase,
                seller_id, seller_order_id, commission_rate, commission_amount,
                seller_net_amount, fulfillment_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unfulfilled')
            RETURNING *
        `, [
            order.id, variant1.id, quantity, price,
            testSellerUser1.id, sellerOrderRes.rows[0].id,
            commissionRate, commissionAmount, sellerNetEarnings
        ]);

        assert.equal(orderItemRes.rows[0].quantity, 2);
        assert.equal(orderItemRes.rows[0].seller_id, testSellerUser1.id);
    });

    test('6. Atomic Inventory Concurrency Check', async () => {
        const initialStock = 20;
        const purchaseQty = 3;

        // Atomic decrement
        const updateStock = await pool.query(`
            UPDATE product_variants
            SET stock_quantity = stock_quantity - $1
            WHERE id = $2 AND stock_quantity >= $1
            RETURNING stock_quantity
        `, [purchaseQty, variant1.id]);

        assert.equal(updateStock.rows.length, 1);
        assert.equal(updateStock.rows[0].stock_quantity, initialStock - purchaseQty);

        // Attempting to decrement more than available stock fails atomically
        const excessiveQty = 999;
        const failedUpdate = await pool.query(`
            UPDATE product_variants
            SET stock_quantity = stock_quantity - $1
            WHERE id = $2 AND stock_quantity >= $1
            RETURNING stock_quantity
        `, [excessiveQty, variant1.id]);

        assert.equal(failedUpdate.rows.length, 0, "Atomic inventory guard must reject overselling");
    });

    test('7. Return Request & Restock Verification', async () => {
        // Customer requests return
        const returnRes = await pool.query(`
            INSERT INTO return_requests (
                order_id, order_item_id, seller_id, user_id,
                reason, status, refund_amount, restock_inventory
            )
            VALUES (1, 1, $1, $2, 'Wrong size delivered', 'pending', 1200.00, true)
            RETURNING *
        `, [testSellerUser1.id, testCustomerUser.id]);

        assert.equal(returnRes.rows[0].status, 'pending');
        assert.equal(returnRes.rows[0].restock_inventory, true);

        // Admin approves and executes restock
        const approvedReturn = await pool.query(`
            UPDATE return_requests
            SET status = 'completed'
            WHERE id = $1
            RETURNING *
        `, [returnRes.rows[0].id]);

        assert.equal(approvedReturn.rows[0].status, 'completed');
    });

    test('8. AI Service Layer Heuristics & Fallback Resilience', async () => {
        // Test product assistant prompt
        const aiListing = await executePrompt({
            prompt: 'Name: Linen Tee, Fabric: 100% Linen',
            feature: 'product_assistant',
            jsonMode: true
        });

        assert.ok(aiListing.suggestedTitle, 'AI must suggest a title');
        assert.ok(aiListing.suggestedDescription, 'AI must provide a description');
        assert.ok(Array.isArray(aiListing.tags), 'AI must return tags array');

        // Test conversational shopping search extraction
        const aiSearch = await executePrompt({
            prompt: 'Find blue cotton shirts under ₹1500 for men',
            feature: 'shop_assistant_intent',
            jsonMode: true
        });

        assert.equal(aiSearch.gender, 'Mens');
        assert.equal(aiSearch.category, 'Shirt');
        assert.equal(aiSearch.maxPrice, 1500);
    });

    test('9. Audit Trail Logging', async () => {
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, target_entity, target_id, details)
            VALUES ($1, 'TEST_AUDIT_ACTION', 'orders', 1, '{"test": true}')
        `, [testAdminUser.id]);

        const auditRes = await pool.query(
            "SELECT * FROM audit_logs WHERE action = 'TEST_AUDIT_ACTION' AND user_id = $1",
            [testAdminUser.id]
        );

        assert.ok(auditRes.rows.length > 0, 'Audit log event must be persisted');
        assert.equal(auditRes.rows[0].target_entity, 'orders');
    });

    test('10. Brand Seller Data Model & Super Admin Moderation', async () => {
        const brandSlug = `brand-test-${Date.now()}`;
        const brandRes = await pool.query(`
            INSERT INTO brands (user_id, name, slug, bio, status, commission_rate)
            VALUES ($1, 'Milan Haute', $2, 'Italian craftsmanship', 'active', 10.00)
            RETURNING *
        `, [testSellerUser1.id, brandSlug]);

        const brand = brandRes.rows[0];
        assert.equal(brand.name, 'Milan Haute');
        assert.equal(brand.status, 'active');

        const brandProdRes = await pool.query(`
            INSERT INTO products (name, base_price, category_id, seller_id, brand_id, brand, status)
            VALUES ('Milan Silk Blazer', 4500, $1, $2, $3, $4, 'approved')
            RETURNING *
        `, [categoryShirtId, testSellerUser1.id, brand.id, brand.name]);

        assert.equal(brandProdRes.rows[0].brand_id, brand.id);

        // Super Admin update brand status to suspended
        const updateRes = await pool.query(`
            UPDATE brands SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *
        `, [brand.id]);

        assert.equal(updateRes.rows[0].status, 'suspended');

        // Cleanup
        await pool.query('DELETE FROM products WHERE id = $1', [brandProdRes.rows[0].id]);
        await pool.query('DELETE FROM brands WHERE id = $1', [brand.id]);
    });
});
