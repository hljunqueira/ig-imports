import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { NavItem } from '../types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { itemCount, openCart } = useCartStore();
    const { isAuthenticated, user, logout } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavigation = (href: string) => {
        if (href.startsWith('/')) {
            navigate(href);
            return;
        }

        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: href } });
        } else {
            const element = document.getElementById(href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navLinks: NavItem[] = [
        { label: "Início", href: "hero" },
        {
            label: "Clubes Europeus",
            href: "/catalog",
            children: [
                { label: "Premier League", href: "/catalog?category=premier-league" },
                { label: "La Liga", href: "/catalog?category=la-liga" },
                { label: "Bundesliga", href: "/catalog?category=bundesliga" },
                { label: "Serie A", href: "/catalog?category=serie-a" },
            ]
        },
        { label: "Seleções", href: "/catalog?category=selecoes" },
        { label: "Brasileirão", href: "/catalog?category=brasileirao" },
        { label: "Outros", href: "/catalog?category=outros" },
    ];

    const count = itemCount();

    return (
        <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md py-2' : 'bg-transparent py-6'}`}>
            <div className="max-w-480 mx-auto px-6 sm:px-12">
                <div className="flex justify-between items-center h-16">
                    <div
                        className="shrink-0 flex items-center gap-3 group cursor-pointer"
                        onClick={() => handleNavigation('hero')}
                    >
                        <img
                            alt="IG Imports Logo"
                            className="h-12 w-auto group-hover:rotate-12 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] mix-blend-screen"
                            src={IMAGES.LOGO}
                        />
                    </div>
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <div key={link.label} className="relative group">
                                <button
                                    onClick={() => !link.children && handleNavigation(link.href)}
                                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-primary relative py-4 ${location.pathname === link.href ? 'text-primary' : 'text-gray-300'}`}
                                >
                                    {link.label}
                                    <span className={`absolute bottom-2 left-0 h-px bg-primary transition-all duration-300 ${location.pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </button>

                                {/* Dropdown Menu */}
                                {link.children && (
                                    <div className="absolute top-full left-0 bg-background-dark border border-white/10 py-2 min-w-45 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                                        {link.children.map((child) => (
                                            <button
                                                key={child.label}
                                                onClick={() => handleNavigation(child.href)}
                                                className="block w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-white hover:text-primary transition-colors">
                            <span className="material-symbols-outlined font-light text-2xl">search</span>
                        </button>
                        <button onClick={openCart} className="text-white hover:text-primary transition-colors relative group">
                            <span className="material-symbols-outlined font-light text-2xl">shopping_bag</span>
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-background-dark text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {count > 9 ? '9+' : count}
                                </span>
                            )}
                        </button>

                        {/* Auth area */}
                        {isAuthenticated ? (
                            <div className="relative group">
                                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 px-3 py-2 hover:bg-primary/10 transition-all">
                                    <span className="material-symbols-outlined text-base">person</span>
                                    <span className="hidden sm:inline">{user?.fullName?.split(' ')[0] || 'Admin'}</span>
                                </button>
                                <div className="absolute top-full right-0 bg-background-dark border border-white/10 py-2 min-w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                                    {user?.role === 'admin' && (
                                        <Link
                                            to="/admin"
                                            className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">dashboard</span>
                                            Painel Admin
                                        </Link>
                                    )}
                                    <Link
                                        to="/client-area"
                                        className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">manage_accounts</span>
                                        Minha Conta
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">logout</span>
                                        Sair
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-primary transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-base">person</span>
                                <span className="hidden sm:inline">Entrar</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

