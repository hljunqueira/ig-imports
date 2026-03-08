-- ========================================
-- IG Imports - Production Seed Data
-- ========================================
-- Execute após criar o schema para inserir dados essenciais

-- ========================================
-- CATEGORIES (Essenciais)
-- ========================================
INSERT INTO categories (name, slug, sort_order, is_active) VALUES
('Premier League', 'premier-league', 1, true),
('La Liga', 'la-liga', 2, true),
('Bundesliga', 'bundesliga', 3, true),
('Serie A', 'serie-a', 4, true),
('Seleções', 'selecoes', 5, true),
('Brasileirão', 'brasileirao', 6, true),
('Retrô', 'retro', 7, true),
('Outros', 'outros', 8, true)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- ADMIN USER SETUP (Execute manualmente após criar usuário no Supabase Auth)
-- ========================================
-- NOTA: Execute este comando APÓS criar o usuário via Supabase Studio ou API
-- Substitua 'USER_UUID_HERE' pelo UUID do usuário criado

/*
-- Exemplo de como criar admin manualmente:
INSERT INTO admin_profiles (id, full_name, role)
VALUES (
  'USER_UUID_HERE',  -- Substitua pelo UUID do usuário
  'Administrator',    -- Nome do administrador
  'super_admin'       -- Role: 'admin' ou 'super_admin'
)
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
*/

-- ========================================
-- SEED COMPLETE
-- ========================================
