
-- Phase 2: Refined Product Schema

-- 1. Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gallery TEXT[],
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 2. Update status check constraint if simple modification isn't possible (Postgres requires dropping constraint)
-- For simplicity in dev, we'll just allow the new values if constraint exists, or drop and recreate.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_status_check') THEN
        ALTER TABLE products DROP CONSTRAINT products_status_check;
    END IF;
END $$;

ALTER TABLE products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('active', 'draft', 'sold_out', 'archived'));

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- 4. Function to auto-generate slug from name if empty (optional but helpful)
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Remove trailing/leading hyphens
        NEW.slug := trim(both '-' from NEW.slug);
        -- Append random chars to ensure uniqueness could be done here, but let's keep it simple and expect app to handle or error
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER product_slug_trigger
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION generate_slug();
