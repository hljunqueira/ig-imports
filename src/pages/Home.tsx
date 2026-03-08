import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Product, Category, productService, categoryService } from '../lib/products';
import { reviewsService } from '../lib/reviews';
import { requestsService } from '../lib/requests';
import { settingsService, StoreSettings } from '../lib/settings';
import { formatCurrency } from '../lib/utils';
import type { ProductReview, ProductRequest } from '../types';
import { useDialog } from '../context/DialogContext';

const JERSEYS = [
  "/hero-jersey-removebg-preview.png",
  "/hero-real-removebg-preview.png",
  "/hero-chelsea-removebg-preview.png",
  "/hero-city-removebg-preview.png",
  "/hero-flamengo-removebg-preview.png"
];

const Home: React.FC = () => {
  const { error } = useDialog();
  const [currentJerseyIndex, setCurrentJerseyIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Formulário de encomenda
  const [requestForm, setRequestForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_description: '',
    preferred_brand: '',
    preferred_size: '',
    quantity: 1,
    max_budget: '',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const scrollToId = (location.state as any).scrollTo;
      const element = document.getElementById(scrollToId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentJerseyIndex((prev) => (prev + 1) % JERSEYS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carregar dados da API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Produtos em destaque
        const products = await productService.getAll({ status: 'active', featured: true });
        if (products.length === 0) {
          const all = await productService.getAll({ status: 'active' });
          setFeaturedProducts(all.slice(0, 4));
        } else {
          setFeaturedProducts(products.slice(0, 4));
        }
        setLoadingProducts(false);

        // Categorias ativas
        const cats = await categoryService.getAll();
        setCategories(cats.filter(c => c.is_active).slice(0, 6));
        setLoadingCategories(false);

        // Avaliações aprovadas e destacadas
        const revs = await reviewsService.getReviews({ approved: true, featured: true });
        setReviews(revs.slice(0, 4));
        setLoadingReviews(false);

        // Configurações da loja
        const storeSettings = await settingsService.get();
        setSettings(storeSettings);
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    };
    loadData();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await requestsService.createRequest({
        ...requestForm,
        max_budget: requestForm.max_budget ? parseFloat(requestForm.max_budget) : undefined,
      });
      setRequestSuccess(true);
      setRequestForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        product_description: '',
        preferred_brand: '',
        preferred_size: '',
        quantity: 1,
        max_budget: '',
        urgency: 'normal',
      });
      setTimeout(() => setRequestSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting request:', err);
      await error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmittingRequest(false);
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

      {/* Hero Section */}
      <header id="hero" className="relative h-screen w-full overflow-hidden flex items-center bg-background-dark perspective-1000">
        <div className="absolute inset-0 bg-black z-0">
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-20"></div>

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:left-auto md:right-[5%] z-30 w-[120vw] sm:w-[80vw] md:w-[45vw] max-w-137.5 aspect-square pointer-events-none flex items-center justify-center opacity-40 md:opacity-100 mix-blend-screen md:mix-blend-normal mt-10 md:mt-0"
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
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(212,175,55,0.15)] absolute inset-0 z-30"
              />
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-480 mx-auto px-6 sm:px-12 w-full pt-20 h-full flex flex-col justify-center items-start">
          <div className="flex flex-col items-center justify-center h-full text-center md:text-left md:items-start w-full md:w-1/2 mr-auto">
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
                  <Link
                    to="/philosophy"
                    className="border border-white/20 text-white px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-colors duration-300 backdrop-blur-md bg-black/30"
                  >
                    Nossa Filosofia
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <Link
          to="/philosophy"
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
        </Link>
      </header>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-background-dark relative z-20">
        <div className="max-w-480 mx-auto px-6 sm:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-3 block">Navegue por</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              NOSSAS <span className="text-primary">CATEGORIAS</span>
            </h2>
          </motion.div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="animate-pulse bg-gray-800 aspect-square rounded-sm"></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/catalog?category=${category.slug}`}
                  className="group relative aspect-square overflow-hidden bg-gray-900 rounded-sm"
                >
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <span className="material-symbols-outlined text-4xl text-gray-600">category</span>
                    </div>
                  )}
                  {/* Overlay: nome visível apenas no hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest text-center px-2">
                      {category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-gray-600">
              <span className="material-symbols-outlined text-5xl mb-4 block">category</span>
              <p className="text-sm">Categorias em breve</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="catalog" className="py-20 bg-background-dark relative z-20">
        <div className="max-w-480 mx-auto px-6 sm:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-3 block">Seleção Especial</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                PRODUTOS EM <span className="text-primary">DESTAQUE</span>
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors items-center gap-1 hidden sm:flex"
            >
              Ver todos
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </motion.div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse">
                  <div className="bg-gray-800 aspect-4/5 mb-4"></div>
                  <div className="h-4 bg-gray-800 w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-800 w-1/4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
            >
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-gray-600">
              <span className="material-symbols-outlined text-5xl mb-4 block">inventory_2</span>
              <p className="text-sm">Novos produtos em breve</p>
            </div>
          )}

          <div className="text-center mt-12 sm:hidden">
            <Link
              to="/catalog"
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
            >
              Ver todos os produtos →
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 bg-background-dark relative z-20">
        {/* Divisor superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>

        <div className="max-w-480 mx-auto px-6 sm:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-3 block">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              O QUE DIZEM NOSSOS <span className="text-primary">CLIENTES</span>
            </h2>
          </motion.div>

          {loadingReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse bg-card-dark border border-white/5 p-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => <div key={s} className="h-3 w-3 bg-gray-700 rounded-sm"></div>)}
                  </div>
                  <div className="h-3 bg-gray-700 w-full mb-2"></div>
                  <div className="h-3 bg-gray-700 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 w-1/2 mb-6"></div>
                  <div className="h-3 bg-gray-700 w-1/3"></div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-card-dark border border-white/5 p-6 flex flex-col hover:border-primary/20 transition-colors"
                >
                  {/* Aspas decorativas */}
                  <span className="text-primary/20 font-display text-5xl leading-none mb-2 select-none">"</span>
                  <p className="text-gray-300 text-sm mb-5 line-clamp-4 grow">{review.comment}</p>
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-sm ${
                            star <= review.rating ? 'text-primary' : 'text-gray-700'
                          }`}
                          style={{ fontSize: '14px' }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-bold uppercase tracking-wider">{review.customer_name}</span>
                      {review.is_featured && (
                        <span className="text-primary text-[9px] uppercase tracking-widest">Destaque</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 border border-white/5 bg-card-dark">
              <span className="material-symbols-outlined text-5xl text-gray-700 mb-4 block">format_quote</span>
              <p className="text-gray-600 text-sm uppercase tracking-widest">Avaliações em breve</p>
            </div>
          )}
        </div>

        {/* Divisor inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent"></div>
      </section>

      {/* Request Product Section */}
      <section id="encomenda" className="py-24 bg-background-dark relative z-20">
        <div className="max-w-480 mx-auto px-6 sm:px-12">

          {/* Cabeçalho centralizado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-3 block">Não encontrou?</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              SOLICITE UMA <span className="text-primary">ENCOMENDA</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 max-w-lg mx-auto">
              Descreva o que você procura e nossa equipe entrará em contato com um orçamento personalizado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

            {/* Benefícios — coluna menor */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              {[
                { icon: 'verified', title: 'Produtos Exclusivos', desc: 'Importados direto da fonte com autenticidade garantida' },
                { icon: 'schedule', title: 'Orçamento em 24h', desc: 'Resposta rápida com o melhor preço disponível' },
                { icon: 'local_shipping', title: 'Entrega Garantida', desc: 'Rastreamento completo do pedido até sua porta' },
              ].map((item, i) => (
                <motion.div
                  key={item.icon}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-4 p-5 bg-card-dark border border-white/5 hover:border-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-bold mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Formulário — coluna maior */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 bg-card-dark border border-white/5 p-8"
            >
              {requestSuccess ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4 block">check_circle</span>
                  <h3 className="text-xl font-bold text-white mb-2">Solicitação Enviada!</h3>
                  <p className="text-gray-400 text-sm">Entraremos em contato em breve com seu orçamento.</p>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Nome *</label>
                    <input
                      type="text"
                      required
                      value={requestForm.customer_name}
                      onChange={(e) => setRequestForm({ ...requestForm, customer_name: e.target.value })}
                      className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Telefone *</label>
                      <input
                        type="tel"
                        required
                        value={requestForm.customer_phone}
                        onChange={(e) => setRequestForm({ ...requestForm, customer_phone: e.target.value })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        placeholder="(48) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={requestForm.customer_email}
                        onChange={(e) => setRequestForm({ ...requestForm, customer_email: e.target.value })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Descrição do Produto *</label>
                    <textarea
                      required
                      rows={3}
                      value={requestForm.product_description}
                      onChange={(e) => setRequestForm({ ...requestForm, product_description: e.target.value })}
                      className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                      placeholder="Descreva o produto: clube, temporada, tamanho, cor..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Marca Preferida</label>
                      <input
                        type="text"
                        value={requestForm.preferred_brand}
                        onChange={(e) => setRequestForm({ ...requestForm, preferred_brand: e.target.value })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ex: Nike, Adidas..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tamanho</label>
                      <input
                        type="text"
                        value={requestForm.preferred_size}
                        onChange={(e) => setRequestForm({ ...requestForm, preferred_size: e.target.value })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ex: M, G, GG..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.quantity}
                        onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Orçamento Máx</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={requestForm.max_budget}
                        onChange={(e) => setRequestForm({ ...requestForm, max_budget: e.target.value })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Urgência</label>
                      <select
                        value={requestForm.urgency}
                        onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value as any })}
                        className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="w-full bg-primary text-black py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-50 mt-2"
                  >
                    {submittingRequest ? 'Enviando...' : 'Solicitar Encomenda'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Track Order CTA Section */}
      <section className="py-20 bg-background-dark relative z-20">
        <div className="max-w-480 mx-auto px-6 sm:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-linear-to-r from-primary/10 to-transparent border border-primary/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                JÁ FEZ SEU <span className="text-primary">PEDIDO</span>?
              </h3>
              <p className="text-gray-400 text-sm">
                Acompanhe o status do seu pedido em tempo real
              </p>
            </div>
            <button
              onClick={() => navigate('/client-area')}
              className="bg-primary text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors whitespace-nowrap"
            >
              Consultar Pedido
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />

    </motion.div>
  );
};

export default Home;
