import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useParams } from 'react-router-dom';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminOrders from './admin/AdminOrders';
import AdminSettings from './admin/AdminSettings';
import AdminDashboardHome from './admin/AdminDashboardHome';
import AdminFinance from './admin/AdminFinance';
import AdminRequests from './admin/AdminRequests';
import AdminInventory from './admin/AdminInventory';
import AdminReviews from './admin/AdminReviews';
import AdminReports from './admin/AdminReports';

type Section = 'dashboard' | 'products' | 'categories' | 'orders' | 'finance' | 'requests' | 'inventory' | 'reviews' | 'reports' | 'settings';

const AdminLayout: React.FC = () => {
    const { section = 'dashboard' } = useParams<{ section: string }>();
    const [activeSection, setActiveSection] = useState<Section>(section as Section || 'dashboard');
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        setActiveSection(section as Section || 'dashboard');
    }, [section]);

    const handleNavigate = (s: Section) => {
        setActiveSection(s);
        navigate(`/admin/${s === 'dashboard' ? '' : s}`);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems: { id: Section; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'products', label: 'Produtos', icon: 'inventory_2' },
        { id: 'categories', label: 'Categorias', icon: 'category' },
        { id: 'orders', label: 'Pedidos', icon: 'shopping_cart' },
        { id: 'finance', label: 'Financeiro', icon: 'payments' },
        { id: 'requests', label: 'Encomendas', icon: 'request_quote' },
        { id: 'inventory', label: 'Estoque', icon: 'warehouse' },
        { id: 'reviews', label: 'Avaliações', icon: 'reviews' },
        { id: 'reports', label: 'Relatórios', icon: 'analytics' },
        { id: 'settings', label: 'Configurações', icon: 'settings' },
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'products':
                return <AdminProducts />;
            case 'categories':
                return <AdminCategories />;
            case 'orders':
                return <AdminOrders />;
            case 'finance':
                return <AdminFinance />;
            case 'requests':
                return <AdminRequests />;
            case 'inventory':
                return <AdminInventory />;
            case 'reviews':
                return <AdminReviews />;
            case 'reports':
                return <AdminReports />;
            case 'settings':
                return <AdminSettings />;
            default:
                return <AdminDashboardHome />;
        }
    };

    const getSectionTitle = () => {
        switch (activeSection) {
            case 'products': return 'GESTÃO DE PRODUTOS';
            case 'categories': return 'GESTÃO DE CATEGORIAS';
            case 'orders': return 'GESTÃO DE PEDIDOS';
            case 'finance': return 'MÓDULO FINANCEIRO';
            case 'requests': return 'SOLICITAÇÕES DE ENCOMENDA';
            case 'inventory': return 'CONTROLE DE ESTOQUE';
            case 'reviews': return 'AVALIAÇÕES DE PRODUTOS';
            case 'reports': return 'RELATÓRIOS GERENCIAIS';
            case 'settings': return 'CONFIGURAÇÕES';
            default: return 'DASHBOARD';
        }
    };

    const getSectionSubtitle = () => {
        switch (activeSection) {
            case 'products': return 'Controle de inventário e catálogo';
            case 'categories': return 'Organize seus produtos por categorias';
            case 'orders': return 'Acompanhe e gerencie os pedidos';
            case 'finance': return 'Controle de receitas, despesas e fluxo de caixa';
            case 'requests': return 'Gerencie pedidos de produtos personalizados';
            case 'inventory': return 'Movimentações, fornecedores e níveis de estoque';
            case 'reviews': return 'Feedbacks e avaliações dos clientes';
            case 'reports': return 'Análise de vendas e performance da loja';
            case 'settings': return 'Personalize sua loja';
            default: return 'Visão geral da sua loja';
        }
    };

    return (
        <div className="min-h-screen flex bg-background-dark text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar-dark border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <img
                            alt="IG Imports Logo"
                            className="h-8 w-auto"
                            src={IMAGES.LOGO}
                        />
                        <span className="font-display text-sm font-bold tracking-[0.2em] text-gold-gradient">
                            IG ADMIN
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                                activeSection === item.id
                                    ? 'text-primary bg-primary/5 border-l-2 border-primary'
                                    : 'text-gray-500 hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    {user && (
                        <div className="mb-3 px-4">
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            <p className="text-[10px] text-primary uppercase tracking-widest">{user.role}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen">
                <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/50 backdrop-blur-md sticky top-0 z-40 shrink-0">
                    <div>
                        <h1 className="font-display text-xl font-bold tracking-widest">
                            {getSectionTitle()}
                        </h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
                            {getSectionSubtitle()}
                        </p>
                    </div>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Ver loja
                    </a>
                </header>

                <section className="p-8 overflow-y-auto" style={{ height: 'calc(100vh - 5rem)' }}>
                    {renderSection()}
                </section>
            </main>

            <footer className="fixed bottom-0 right-0 p-4 z-50 pointer-events-none">
                <p className="text-[8px] tracking-[0.3em] uppercase text-gray-700">
                    © 2026 IG IMPORTS
                </p>
            </footer>
        </div>
    );
};

export default AdminLayout;
