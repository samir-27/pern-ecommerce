-- ====================================================================
-- MIGRATION: 001_multivendor_init.sql
-- Multi-Vendor Fashion Marketplace Schema Extension
-- Safe, additive migration preserving all existing tables & data
-- ====================================================================

BEGIN;

-- 1. Extend Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Seller Applications
CREATE TABLE IF NOT EXISTS seller_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    tax_id VARCHAR(100),
    document_urls TEXT[] DEFAULT '{}',
    status VARCHAR(40) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seller_apps_user ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_apps_status ON seller_applications(status);

-- 3. Seller Stores
CREATE TABLE IF NOT EXISTS seller_stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    bio TEXT,
    policy_return TEXT,
    policy_shipping TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seller_stores_slug ON seller_stores(slug);
CREATE INDEX IF NOT EXISTS idx_seller_stores_user ON seller_stores(user_id);

-- 4. Extend Products with Seller & Fashion Attributes
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES seller_stores(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS clothing_type VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_material VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit VARCHAR(60);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern VARCHAR(60);
ALTER TABLE products ADD COLUMN IF NOT EXISTS season VARCHAR(60);
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 5. Extend Product Variants with Enhanced Inventory Fields
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight_grams INTEGER;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- 6. Seller Orders (Fulfillment Sub-Orders per Seller)
CREATE TABLE IF NOT EXISTS seller_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    store_id INTEGER REFERENCES seller_stores(id),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    seller_net_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) DEFAULT 'unfulfilled',
    tracking_number VARCHAR(120),
    shipping_carrier VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller ON seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_order ON seller_orders(order_id);

-- 7. Extend Order Items with Seller Fulfillment Details
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_order_id INTEGER REFERENCES seller_orders(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 10.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS seller_net_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(40) DEFAULT 'unfulfilled';

CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_order ON order_items(seller_order_id);

-- 8. Platform Commission Rules
CREATE TABLE IF NOT EXISTS commission_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(40) NOT NULL, -- 'global', 'category', 'seller'
    target_id INTEGER,
    rate NUMERIC(5,2) NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed global default commission 10% if not exists
INSERT INTO commission_rules (rule_type, target_id, rate)
SELECT 'global', NULL, 10.00
WHERE NOT EXISTS (SELECT 1 FROM commission_rules WHERE rule_type = 'global');

-- 9. Seller Payouts Ledger
CREATE TABLE IF NOT EXISTS seller_payouts (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    store_id INTEGER REFERENCES seller_stores(id),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(40) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payout_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference_id VARCHAR(120),
    notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);

-- 10. Return & Exchange Requests
CREATE TABLE IF NOT EXISTS return_requests (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    order_item_id INTEGER NOT NULL REFERENCES order_items(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    image_urls TEXT[] DEFAULT '{}',
    status VARCHAR(40) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    refund_amount NUMERIC(10,2),
    restock_inventory BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_return_requests_seller ON return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);

-- 11. Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id INTEGER,
    ip_address VARCHAR(45),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 12. AI Usage & Telemetry Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    feature VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    model VARCHAR(100),
    status VARCHAR(40) DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Backfill Default Store for Primary Admin
INSERT INTO seller_stores (user_id, name, slug, bio, is_active)
SELECT 1, 'MINIMAL Official Store', 'minimal-official', 'The flagship store of MINIMAL. fashion marketplace.', true
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM seller_stores WHERE user_id = 1);

-- Backfill legacy products without seller
UPDATE products
SET seller_id = 1,
    store_id = (SELECT id FROM seller_stores WHERE user_id = 1 LIMIT 1),
    status = 'approved'
WHERE seller_id IS NULL AND EXISTS (SELECT 1 FROM seller_stores WHERE user_id = 1);

COMMIT;
