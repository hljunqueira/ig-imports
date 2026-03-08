
-- Insert Categories
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('Premier League', 'premier-league', 1, true),
('La Liga', 'la-liga', 2, true),
('Bundesliga', 'bundesliga', 3, true),
('Serie A', 'serie-a', 4, true),
('Seleções', 'selecoes', 5, true),
('Brasileirão', 'brasileirao', 6, true),
('Retrô', 'retro', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Products (Sample Data) with Slugs
WITH cat_pl AS (SELECT id FROM categories WHERE slug = 'premier-league'),
     cat_ll AS (SELECT id FROM categories WHERE slug = 'la-liga'),
     cat_sel AS (SELECT id FROM categories WHERE slug = 'selecoes')

INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, sizes, stock, status, is_featured) VALUES
('Manchester City Home 24/25', 'manchester-city-home-24-25', 'Camisa titular do Manchester City temporada 2024/25. Tecido tecnológico de alta absorção.', 189.90, 249.90, (SELECT id FROM cat_pl), 'https://images.unsplash.com/photo-1580087681377-de9110d7237e?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG'], 50, 'active', true),
('Arsenal Away 24/25', 'arsenal-away-24-25', 'Camisa reserva do Arsenal temporada 2024/25. Design moderno e arrojado.', 189.90, NULL, (SELECT id FROM cat_pl), 'https://images.unsplash.com/photo-1522778119026-d647f0565c6b?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG'], 30, 'active', true),
('Real Madrid Home 24/25', 'real-madrid-home-24-25', 'Camisa titular do Real Madrid. A clássica branca com detalhes em dourado.', 199.90, 299.90, (SELECT id FROM cat_ll), 'https://images.unsplash.com/photo-1556906781-9a412961d289?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG', 'XGG'], 100, 'active', true),
('Barcelona Home 24/25', 'barcelona-home-24-25', 'Camisa titular do Barcelona. Cores vibrantes e escudo bordado.', 199.90, NULL, (SELECT id FROM cat_ll), 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG'], 45, 'active', true),
('Brasil Home 2024', 'brasil-home-2024', 'Camisa amarelinha da seleção brasileira. Orgulho nacional.', 229.90, NULL, (SELECT id FROM cat_sel), 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG'], 150, 'active', true),
('Argentina Away 2024', 'argentina-away-2024', 'Camisa reserva da seleção argentina. Campeã do mundo.', 229.90, 259.90, (SELECT id FROM cat_sel), 'https://images.unsplash.com/photo-1627916560065-4f466b036577?auto=format&fit=crop&q=80', ARRAY['P', 'M', 'G', 'GG'], 80, 'active', false)
ON CONFLICT (slug) DO NOTHING;
