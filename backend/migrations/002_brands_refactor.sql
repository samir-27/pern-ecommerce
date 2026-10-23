-- ====================================================================
-- MIGRATION: 002_brands_refactor.sql
-- Transition from generic multi-store to dedicated Brand Seller model
-- Safe, additive migration preserving all existing data
-- ====================================================================

BEGIN;

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    bio TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    policy_return TEXT,
    policy_shipping TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    status VARCHAR(30) DEFAULT 'active', -- 'pending', 'active', 'suspended', 'rejected'
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_user ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);

-- 2. Migrate existing seller_stores into brands
INSERT INTO brands (id, user_id, name, slug, logo_url, banner_url, bio, policy_return, policy_shipping, commission_rate, status, is_featured, created_at)
SELECT id, user_id, name, slug, logo_url, banner_url, bio, policy_return, policy_shipping, commission_rate, 
       CASE WHEN is_active THEN 'active' ELSE 'suspended' END, is_featured, created_at
FROM seller_stores
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    bio = EXCLUDED.bio,
    commission_rate = EXCLUDED.commission_rate,
    status = EXCLUDED.status;

-- Sync sequence
SELECT setval('brands_id_seq', (SELECT COALESCE(MAX(id), 1) FROM brands));

-- 3. Extend products with brand_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;
UPDATE products SET brand_id = store_id WHERE brand_id IS NULL AND store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- 4. Extend seller_orders with brand_id
ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;
UPDATE seller_orders SET brand_id = store_id WHERE brand_id IS NULL AND store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seller_orders_brand_id ON seller_orders(brand_id);

-- 5. Extend seller_payouts with brand_id
ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;
UPDATE seller_payouts SET brand_id = store_id WHERE brand_id IS NULL AND store_id IS NOT NULL;

-- 6. Add brand audit action types
COMMENT ON TABLE brands IS 'Dedicated fashion brands participating in the marketplace';

COMMIT;
