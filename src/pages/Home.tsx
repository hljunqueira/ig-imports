import React from 'react';
import { Link } from 'react-router-dom';
import { IMAGES, MOCK_PRODUCTS } from '../constants';
import { NavItem } from '../types';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const JERSEYS = [
  "/hero-jersey-removebg-preview.png",
  "/hero-real-removebg-preview.png",
  "/hero-chelsea-removebg-preview.png",
  "/hero-city-removebg-preview.png",
  "/hero-flamengo-removebg-preview.png"
];

const Home: React.FC = () => {
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);
  const [currentJerseyIndex, setCurrentJerseyIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentJerseyIndex((prev) => (prev + 1) % JERSEYS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks: NavItem[] = [
    { label: "Início", href: "hero" },
    { label: "Clubes Europeus", href: "philosophie" },
    { label: "Seleções", href: "philosophie" },
    { label: "Brasileirão", href: "philosophie" },
    { label: "Acesso", href: "philosophie" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background-dark text-slate-100 selection:bg-primary selection:text-background-dark overflow-x-hidden"
    >
      <nav className="fixed top-0 z-50 w-full glass-nav transition-all duration-300">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-12">
          <div className="flex justify-between items-center h-24">
            <div
              className="flex-shrink-0 flex items-center gap-3 group cursor-pointer"
              onClick={() => scrollToSection('hero')}
            >
              <img
                alt="IG Imports Logo"
                className="h-20 w-auto group-hover:rotate-12 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] mix-blend-screen"
                src={IMAGES.LOGO}
              />
            </div>
            <div className="hidden lg:flex items-center gap-12">
              {navLinks.map((link, i) => (
                link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-primary relative group ${link.label === 'Acesso' ? 'text-primary' : 'text-gray-300'}`}
                  >
                    {link.label}
                    <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300"></span>
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href)}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 hover:text-primary transition-all relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300"></span>
                  </button>
                )
              ))}
            </div>
            <div className="flex items-center gap-6">
              <button className="text-white hover:text-primary transition-colors">
                <span className="material-symbols-outlined font-light text-2xl">search</span>
              </button>
              <button className="text-white hover:text-primary transition-colors relative group">
                <span className="material-symbols-outlined font-light text-2xl">shopping_bag</span>
                <span className="absolute -top-1 -right-1 bg-primary text-background-dark text-[8px] font-bold h-3 w-3 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">0</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Radical Hero Section */}
      <header id="hero" className="relative h-screen w-full overflow-hidden flex items-center bg-background-dark perspective-1000">
        {/* Background Elements - Luxury Image */}
        <div className="absolute inset-0 bg-black z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-20"></div>

          {/* Dynamic Jersey - Parallax & Float & Morph */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:left-auto md:right-[5%] z-50 w-[120vw] sm:w-[80vw] md:w-[45vw] max-w-[550px] aspect-square pointer-events-none flex items-center justify-center opacity-40 md:opacity-100 mix-blend-screen md:mix-blend-normal mt-10 md:mt-0"
          >
            <AnimatePresence mode='wait'>
              <motion.img
                key={currentJerseyIndex}
                src={JERSEYS[currentJerseyIndex]}
                alt="Luxury Jersey"
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(212,175,55,0.15)] absolute inset-0 z-50"
              />
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-[1920px] mx-auto px-6 sm:px-12 w-full pt-20 h-full flex flex-col justify-center items-start">
          <div className="flex flex-col items-center justify-center h-full text-center md:text-left md:items-start w-full md:w-1/2 mr-auto">
            {/* Text Content - Left Aligned Luxury Layout */}
            <div className="flex flex-col items-center md:items-start relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center md:items-start"
              >
                <div className="flex items-center gap-4 mb-8">
                  <span className="h-[1px] w-12 bg-primary/50"></span>
                  <span className="text-primary text-xs font-bold tracking-[0.4em] uppercase">Coleção Exclusiva</span>
                  <span className="h-[1px] w-12 bg-primary/50"></span>
                </div>
                {/* Text with backdrop blur to stand out against jersey */}
                <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-8 relative text-center md:text-left">
                  VISTA A <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#F9E29B] italic relative inline-block">
                    GRANDEZA
                    <span className="absolute -inset-1 blur-2xl bg-primary/10 -z-10 rounded-full"></span>
                  </span>
                </h1>
                <p className="text-gray-300 text-sm md:text-lg font-light max-w-xl leading-relaxed tracking-wide mb-12 drop-shadow-lg text-center md:text-left">
                  A grandeza não se pede, se veste. Da precisão dos detalhes à imponência do escudo: a coleção definitiva para quem nasceu para vencer.
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={() => scrollToSection('philosophie')}
                    className="bg-white text-black px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Saiba Mais
                  </button>
                  <button
                    onClick={() => scrollToSection('philosophie')}
                    className="border border-white/20 text-white px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-colors duration-300 backdrop-blur-md bg-black/30"
                  >
                    Nossa Filosofia
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          onClick={() => scrollToSection('philosophie')}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 cursor-pointer hover:scale-110 transition-transform"
        >
          <motion.span
            initial={{ y: 0 }}
            animate={{ y: 10 }}
            transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
            className="material-symbols-outlined text-primary/60 text-3xl font-light"
          >
            keyboard_arrow_down
          </motion.span>
        </motion.div>
      </header>

      {/* Philosophy / Coming Soon Section */}
      <section id="philosophie" className="py-32 bg-background-dark relative z-20 overflow-hidden min-h-[50vh] flex items-center justify-center">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-6 block">O Futuro Chegou</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
              EM BREVE, A MAIOR LOJA VIRTUAL DE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#F9E29B] italic">CAMISAS PREMIUM</span> IMPORTADAS.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-12">
              Estamos preparando um acervo exclusivo das peças mais cobiçadas do futebol mundial.
              Qualidade 1:1, detalhes impecáveis e a experiência de compra que você merece.
            </p>

            <div className="inline-flex flex-col items-center gap-4">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <p className="text-white/60 text-xs tracking-widest uppercase">Aguarde o Lançamento</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-black border-t border-white/5 py-12 relative z-20">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-12 flex flex-col items-center gap-8">
          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              )
            ))}
          </div>

          <div className="w-full h-[1px] bg-white/5 max-w-xs"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
            <p className="text-[10px] uppercase tracking-[0.2em] font-light text-gray-500 text-center md:text-left">
              &copy; 2026 IG Imports. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden md:block h-[1px] w-8 bg-gray-600"></span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-light text-gray-500">
                Desenvolvido por <a href="https://portfolio-hljdev.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-primary transition-colors cursor-pointer">Hlj.dev</a>
              </p>
            </div>
          </div>
        </div>
      </footer>


    </motion.div>
  );
};

export default Home;