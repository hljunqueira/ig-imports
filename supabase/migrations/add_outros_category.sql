INSERT INTO categories (name, slug, sort_order, is_active) 
VALUES ('Outros', 'outros', 8, true) 
ON CONFLICT (slug) DO NOTHING;
