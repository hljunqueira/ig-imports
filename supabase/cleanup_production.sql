-- ========================================
-- IG Imports - Production Cleanup Script
-- ========================================
-- ⚠️ AVISO: Este script remove TODOS os dados existentes!
-- Execute apenas quando for criar um ambiente limpo

-- ========================================
-- LIMPEZA DE DADOS (Execute com cuidado!)
-- ========================================

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles DISABLE ROW LEVEL SECURITY;

-- Limpar dados (ordem importante devido a FKs)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM admin_profiles;

-- Opcional: Limpar usuários de auth (execute apenas se necessário)
-- DELETE FROM auth.users WHERE email LIKE '%test%' OR email LIKE '%admin@%';

-- Resetar sequências
ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;

-- Reabilitar RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- LIMPEZA COMPLETA
-- ========================================
