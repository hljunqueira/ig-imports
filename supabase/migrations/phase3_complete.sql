-- ========================================
-- IG Imports - Phase 3: Complete E-commerce
-- Migration for full functionality
-- ========================================

-- ========================================
-- 1. ADD SLUG TO PRODUCTS (if not exists)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'slug'
    ) THEN
        ALTER TABLE products ADD COLUMN slug TEXT UNIQUE;
        -- Generate slugs for existing products
        UPDATE products SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
END $$;

-- ========================================
-- 2. CLIENTS TABLE (for customer accounts)
-- ========================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    password_hash TEXT, -- For future implementation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. STORE SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT DEFAULT 'IG Imports',
    store_email TEXT,
    store_phone TEXT DEFAULT '554896231041',
    store_whatsapp TEXT DEFAULT '554896231041',
    store_address TEXT,
    store_city TEXT,
    store_state TEXT(2),
    store_zip TEXT,
    
    -- Social Media
    instagram_url TEXT,
    facebook_url TEXT,
    
    -- SEO
    meta_title TEXT DEFAULT 'IG Imports - Camisas Exclusivas',
    meta_description TEXT DEFAULT 'Loja especializada em camisas de futebol exclusivas e importadas.',
    
    -- Appearance
    primary_color TEXT DEFAULT '#D4AF37',
    logo_url TEXT,
    
    -- Business Settings
    currency TEXT DEFAULT 'BRL',
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    free_delivery_min DECIMAL(10,2) DEFAULT 0,
    
    -- Features
    enable_delivery BOOLEAN DEFAULT true,
    enable_pickup BOOLEAN DEFAULT true,
    require_login BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO store_settings (id, store_name)
VALUES (1, 'IG Imports')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 4. COUPONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. ADD CLIENT_ID TO ORDERS
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- 6. ADD COUPON TO ORDERS
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'coupon_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
        ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- ========================================
-- 7. RLS POLICIES FOR NEW TABLES
-- ========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Clients can read their own data
CREATE POLICY "Clients can view own data" ON clients
    FOR SELECT USING (id = auth.uid());

-- Anyone can register as client
CREATE POLICY "Anyone can register as client" ON clients
    FOR INSERT WITH CHECK (true);

-- Clients can update own data
CREATE POLICY "Clients can update own data" ON clients
    FOR UPDATE USING (id = auth.uid());

-- Public can read store settings
CREATE POLICY "Public can view store settings" ON store_settings
    FOR SELECT USING (true);

-- Admins can manage store settings
CREATE POLICY "Admins manage store settings" ON store_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
    );

-- Admins manage coupons
CREATE POLICY "Admins manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
    );

-- Public can view active coupons (for validation)
CREATE POLICY "Public can view active coupons" ON coupons
    FOR SELECT USING (is_active = true);

-- ========================================
-- 8. INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ========================================
-- 9. TRIGGERS
-- ========================================
CREATE TRIGGER clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 10. STORAGE BUCKETS
-- ========================================
-- Run in Supabase Dashboard > Storage or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true);
