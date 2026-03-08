import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
    const navigate = useNavigate();

    const scrollToSection = (id: string) => {
        // Basic implementation - if on home, scroll. If not, go home then scroll.
        // For simplicity in footer, we might just link to pages or simple anchors.
        // Let's keep it simple.
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate(`/#${id}`);
        }
    };

    const navLinks = [
        { label: "Início", href: "/" },
        { label: "Catálogo", href: "/catalog" },
        { label: "Filosofia", href: "/philosophy" },
        { label: "Área do Cliente", href: "/client-area" },
    ];

    return (
        <footer className="bg-black border-t border-white/5 py-12 relative z-20">
            <div className="max-w-480 mx-auto px-6 sm:px-12 flex flex-col items-center gap-8">
                {/* Navigation */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="w-full h-px bg-white/5 max-w-xs"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-light text-gray-500 text-center md:text-left">
                        &copy; 2026 IG IMPORTS
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="hidden md:block h-px w-8 bg-gray-600"></span>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-light text-gray-500">
                            Desenvolvido por <a href="https://portfolio-hljdev.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-primary transition-colors cursor-pointer">Hlj.dev</a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
