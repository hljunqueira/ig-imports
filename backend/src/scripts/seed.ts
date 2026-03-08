import { query, withTransaction } from '../config/database';

const seedData = async () => {
    console.log('🌱 Starting database seed...\n');

    try {
        await withTransaction(async (client) => {
            // Seed categories
            console.log('📁 Seeding categories...');
            const categories = [
                { name: 'Premier League', slug: 'premier-league', sort_order: 1 },
                { name: 'La Liga', slug: 'la-liga', sort_order: 2 },
                { name: 'Bundesliga', slug: 'bundesliga', sort_order: 3 },
                { name: 'Serie A', slug: 'serie-a', sort_order: 4 },
                { name: 'Seleções', slug: 'selecoes', sort_order: 5 },
                { name: 'Brasileirão', slug: 'brasileirao', sort_order: 6 },
                { name: 'Retrô', slug: 'retro', sort_order: 7 },
                { name: 'Outros', slug: 'outros', sort_order: 8 },
            ];

            for (const cat of categories) {
                await client.query(
                    `INSERT INTO categories (name, slug, sort_order, is_active)
                     VALUES ($1, $2, $3, true)
                     ON CONFLICT (slug) DO NOTHING`,
                    [cat.name, cat.slug, cat.sort_order]
                );
            }

            // Get category IDs
            const catResult = await client.query('SELECT id, slug FROM categories');
            const categoryMap = new Map(catResult.rows.map(r => [r.slug, r.id]));

            // Seed products
            console.log('👕 Seeding products...');
            const products = [
                {
                    name: 'Manchester City Home 24/25',
                    slug: 'manchester-city-home-24-25',
                    description: 'Camisa titular do Manchester City temporada 2024/25',
                    price: 189.90,
                    original_price: 249.90,
                    category_slug: 'premier-league',
                    stock: 50,
                    min_stock: 5,
                    is_featured: true,
                    status: 'active',
                },
                {
                    name: 'Real Madrid Home 24/25',
                    slug: 'real-madrid-home-24-25',
                    description: 'Camisa titular do Real Madrid',
                    price: 199.90,
                    original_price: 299.90,
                    category_slug: 'la-liga',
                    stock: 100,
                    min_stock: 5,
                    is_featured: true,
                    status: 'active',
                },
                {
                    name: 'Brasil Home 2024',
                    slug: 'brasil-home-2024',
                    description: 'Camisa amarelinha da seleção brasileira',
                    price: 229.90,
                    category_slug: 'selecoes',
                    stock: 150,
                    min_stock: 10,
                    is_featured: true,
                    status: 'active',
                },
                {
                    name: 'Flamengo Home 2024',
                    slug: 'flamengo-home-2024',
                    description: 'Camisa do Mengão',
                    price: 179.90,
                    category_slug: 'brasileirao',
                    stock: 80,
                    min_stock: 5,
                    is_featured: false,
                    status: 'active',
                },
            ];

            for (const prod of products) {
                const categoryId = categoryMap.get(prod.category_slug);
                await client.query(
                    `INSERT INTO products (name, slug, description, price, original_price, category_id, stock, min_stock, is_featured, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (slug) DO NOTHING`,
                    [
                        prod.name,
                        prod.slug,
                        prod.description,
                        prod.price,
                        prod.original_price || null,
                        categoryId,
                        prod.stock,
                        prod.min_stock,
                        prod.is_featured,
                        prod.status,
                    ]
                );
            }

            // Seed financial categories
            console.log('💰 Seeding financial categories...');
            const financialCategories = [
                { name: 'Vendas', type: 'income' },
                { name: 'Serviços', type: 'income' },
                { name: 'Compras', type: 'expense' },
                { name: 'Salários', type: 'expense' },
                { name: 'Aluguel', type: 'expense' },
                { name: 'Utilidades', type: 'expense' },
                { name: 'Marketing', type: 'expense' },
                { name: 'Impostos', type: 'expense' },
            ];

            for (const cat of financialCategories) {
                await client.query(
                    `INSERT INTO financial_categories (name, type, is_active)
                     VALUES ($1, $2, true)
                     ON CONFLICT DO NOTHING`,
                    [cat.name, cat.type]
                );
            }

            // Seed suppliers
            console.log('🏭 Seeding suppliers...');
            const suppliers = [
                { name: 'Nike Brasil', contact_name: 'João Silva', phone: '11-99999-1111', email: 'contato@nike.com.br' },
                { name: 'Adidas Brasil', contact_name: 'Maria Santos', phone: '11-99999-2222', email: 'contato@adidas.com.br' },
                { name: 'Puma Brasil', contact_name: 'Pedro Costa', phone: '11-99999-3333', email: 'contato@puma.com.br' },
            ];

            for (const sup of suppliers) {
                await client.query(
                    `INSERT INTO suppliers (name, contact_name, phone, email, is_active)
                     VALUES ($1, $2, $3, $4, true)
                     ON CONFLICT DO NOTHING`,
                    [sup.name, sup.contact_name, sup.phone, sup.email]
                );
            }

            console.log('\n✅ Seed completed successfully!');
        });
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }

    process.exit(0);
};

seedData();
