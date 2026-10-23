-- ====================================================================
-- MINIMAL. Multi-Vendor Fashion Marketplace - Full PostgreSQL Schema
-- Buyer, Brand Seller, and Super Admin Applications
-- ====================================================================

-- 1. Users Table (Buyers, Brand Sellers, Super Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(32),
    role VARCHAR(30) DEFAULT 'user', -- 'user' (Buyer), 'seller' (Brand), 'admin' (Super Admin)
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Brands Table (Dedicated Brand Seller Model)
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

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clothing Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    images TEXT[] DEFAULT '{}',
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    brand VARCHAR(120),
    clothing_type VARCHAR(80),
    fabric_material VARCHAR(120),
    fit VARCHAR(60),
    pattern VARCHAR(60),
    season VARCHAR(60),
    care_instructions TEXT,
    status VARCHAR(30) DEFAULT 'approved', -- 'approved', 'pending_approval', 'rejected'
    moderation_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- 5. Clothing Product Variants Table (Size & Color Inventory)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    size VARCHAR(40) NOT NULL,
    color VARCHAR(60) NOT NULL,
    price NUMERIC(10,2),
    compare_at_price NUMERIC(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- 6. Orders Table (Parent Marketplace Orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    payment_status VARCHAR(50) DEFAULT 'paid',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- 7. Seller Orders Table (Brand-Specific Fulfillment Groups)
CREATE TABLE IF NOT EXISTS seller_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    subtotal NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_payout NUMERIC(10,2) NOT NULL,
    fulfillment_status VARCHAR(40) DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'cancelled'
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seller_orders_brand ON seller_orders(brand_id);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    seller_id INTEGER REFERENCES users(id),
    brand_id INTEGER REFERENCES brands(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
