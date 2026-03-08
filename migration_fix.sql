-- Fix missing tables

CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT DEFAULT 'IG Imports',
    store_email TEXT,
    store_phone TEXT,
    store_whatsapp TEXT,
    store_address TEXT,
    store_city TEXT,
    store_state TEXT,
    store_zip TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    meta_title TEXT DEFAULT 'IG Imports',
    meta_description TEXT,
    primary_color TEXT DEFAULT '#D4AF37',
    logo_url TEXT,
    currency TEXT DEFAULT 'BRL',
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    free_delivery_min DECIMAL(10,2) DEFAULT 0,
    enable_delivery BOOLEAN DEFAULT true,
    enable_pickup BOOLEAN DEFAULT true,
    require_login BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

INSERT INTO store_settings (id, store_name)
VALUES (1, 'IG Imports')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    order_id UUID,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    replied_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
