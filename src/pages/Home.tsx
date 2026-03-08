import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IMAGES } from '../constants';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

  const location = useLocation();

  useEffect(() => {
    // Handle scroll from navigation state
    if (location.state && (location.state as any).scrollTo) {
      const scrollToId = (location.state as any).scrollTo;
      const element = document.getElementById(scrollToId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Small delay to ensure render
      }
      // Clear state to avoid scrolling on refresh? 
      // Window.history.replaceState({}, document.title)
    }
  }, [location]);


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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background-dark text-slate-100 selection:bg-primary selection:text-background-dark overflow-x-hidden"
    >
      <Navbar />

      {/* Radical Hero Section */}
      <header id="hero" className="relative h-screen w-full overflow-hidden flex items-center bg-background-dark perspective-1000">
        {/* Background Elements - Luxury Image */}
        <div className="absolute inset-0 bg-black z-0">
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-20"></div>

          {/* Dynamic Jersey - Parallax & Float & Morph */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:left-auto md:right-[5%] z-50 w-[120vw] sm:w-[80vw] md:w-[45vw] max-w-137.5 aspect-square pointer-events-none flex items-center justify-center opacity-40 md:opacity-100 mix-blend-screen md:mix-blend-normal mt-10 md:mt-0"
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

        <div className="relative z-10 max-w-480 mx-auto px-6 sm:px-12 w-full pt-20 h-full flex flex-col justify-center items-start">
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
                  <span className="h-px w-12 bg-primary/50"></span>
                  <span className="text-primary text-xs font-bold tracking-[0.4em] uppercase">Coleção Exclusiva</span>
                  <span className="h-px w-12 bg-primary/50"></span>
                </div>
                {/* Text with backdrop blur to stand out against jersey */}
                <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-8 relative text-center md:text-left">
                  VISTA A <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-gold-light italic relative inline-block">
                    GRANDEZA
                    <span className="absolute -inset-1 blur-2xl bg-primary/10 -z-10 rounded-full"></span>
                  </span>
                </h1>
                <p className="text-gray-300 text-sm md:text-lg font-light max-w-xl leading-relaxed tracking-wide mb-12 drop-shadow-lg text-center md:text-left">
                  A grandeza não se pede, se veste. Da precisão dos detalhes à imponência do escudo: a coleção definitiva para quem nasceu para vencer.
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <Link
                    to="/catalog"
                    className="bg-white text-black px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Ver Catálogo
                  </Link>
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
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-6 block">O Futuro Chegou</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
              A MAIOR LOJA VIRTUAL DE <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-gold-light italic">CAMISAS PREMIUM</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-12">
              Explore nosso acervo exclusivo das peças mais cobiçadas do futebol mundial.
              Qualidade 1:1, detalhes impecáveis e a experiência de compra que você merece.
            </p>

            <div className="inline-flex flex-col items-center gap-4">
              <Link to="/catalog" className="text-white hover:text-primary transition-colors text-xs tracking-widest uppercase border-b border-primary pb-1">Ver Produtos Disponíveis</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

    </motion.div>
  );
};

export default Home;