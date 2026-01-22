import React from 'react';
import { Link } from 'react-router-dom';
import { IMAGES, MOCK_PRODUCTS } from '../constants';
import { NavItem } from '../types';

const Home: React.FC = () => {
  const navLinks: NavItem[] = [
    { label: "Início", href: "#" },
    { label: "Clubes Europeus", href: "#" },
    { label: "Seleções", href: "#" },
    { label: "Brasileirão", href: "#" },
    { label: "Acesso", href: "/login" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-3">
              <img
                alt="IG Imports Logo"
                className="h-12 w-auto"
                src={IMAGES.LOGO}
              />
              <span className="font-display text-xl font-bold tracking-[0.3em] hidden md:block text-gold-gradient">
                IG IMPORTS
              </span>
            </div>
            <div className="hidden lg:flex items-center space-x-10">
              {navLinks.map((link) => (
                link.href.startsWith('/') ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      className={`text-xs font-semibold uppercase tracking-widest transition-colors border-b border-transparent pb-1 ${link.label === 'Acesso' ? 'text-primary border-primary/50' : 'hover:text-primary hover:border-primary'}`}
                    >
                      {link.label}
                    </Link>
                ) : (
                    <a
                      key={link.label}
                      className="text-xs font-semibold uppercase tracking-widest hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                )
              ))}
            </div>
            <div className="flex items-center space-x-6">
              <button 
                className="p-2 hover:text-primary transition-colors"
                onClick={() => alert('Funcionalidade de Busca em desenvolvimento')}
              >
                <span className="material-symbols-outlined font-light">
                  search
                </span>
              </button>
              <button 
                className="p-2 hover:text-primary transition-colors relative"
                onClick={() => alert('Carrinho de compras vazio')}
              >
                <span className="material-symbols-outlined font-light">
                  shopping_bag
                </span>
                <span className="absolute top-1 right-1 bg-primary text-background-dark text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              <button className="lg:hidden p-2 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative h-[90vh] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img
            alt="Detalhes de Tecido Premium"
            className="w-full h-full object-cover scale-105"
            src={IMAGES.HERO_BG}
          />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 text-center md:text-left">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-4 border border-primary/40 text-primary text-[10px] font-bold tracking-[0.4em] uppercase mb-8 bg-primary/5 backdrop-blur-sm">
              A Excelência do Padrão Thai 1.1
            </span>
            <h1 className="text-5xl md:text-8xl font-display font-bold text-white mb-8 leading-[1.1]">
              SOFISTICAÇÃO EM <br />
              <span className="text-gold-gradient">CADA DETALHE</span>
            </h1>
            <p className="text-lg text-gray-300 mb-12 max-w-xl leading-relaxed font-light">
              Descubra a coleção exclusiva de mantos sagrados. Tecidos de alta
              tecnologia, bordados impecáveis e o acabamento que você só
              encontra na IG Imports.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
              <a
                className="gold-gradient text-background-dark px-12 py-5 font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                href="#shop"
              >
                Explorar Coleção
              </a>
              <a
                className="border border-white/20 text-white px-12 py-5 font-bold uppercase tracking-[0.2em] text-xs hover:bg-white/5 transition-colors flex items-center justify-center backdrop-blur-sm"
                href="#"
              >
                Nossa Qualidade
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-bold">
            Scroll
          </span>
          <span className="material-symbols-outlined text-primary/40 animate-bounce font-light">
            expand_more
          </span>
        </div>
      </header>

      <section className="py-24 bg-card-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gold-gradient tracking-widest">
              POR QUE ESCOLHER A IG IMPORTS
            </h2>
            <div className="w-24 h-px bg-primary mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              {
                icon: "workspace_premium",
                title: "Qualidade 1.1",
                desc: "Reprodução fiel aos modelos de jogo, com tecidos tecnológicos e etiquetas autênticas.",
              },
              {
                icon: "inventory_2",
                title: "Embalagem de Luxo",
                desc: "Sua camisa chega protegida em embalagem personalizada, garantindo a melhor experiência.",
              },
              {
                icon: "shutter_speed",
                title: "Envio Prioritário",
                desc: "Logística otimizada para que seu manto chegue o mais rápido possível em suas mãos.",
              },
              {
                icon: "support_agent",
                title: "Suporte Concierge",
                desc: "Atendimento exclusivo e personalizado para tirar todas as suas dúvidas.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center border border-primary/20 text-primary mb-8 group-hover:bg-primary/5 transition-all duration-500 luxury-border">
                  <span className="material-symbols-outlined text-3xl font-light">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold mb-4 tracking-widest uppercase">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed font-light px-4">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32" id="shop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                OS MAIS <span className="text-gold-gradient">DESEJADOS</span>
              </h2>
              <p className="text-gray-400 font-light">
                Uma curadoria exclusiva dos mantos que estão dominando a
                temporada 24/25.
              </p>
            </div>
            <a
              className="text-primary font-bold text-[10px] tracking-[0.4em] uppercase flex items-center gap-3 hover:gap-5 transition-all group border-b border-primary/20 pb-2"
              href="#"
            >
              Ver Coleção Completa{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {MOCK_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="product-card-shine group cursor-pointer bg-card-dark/40 border border-white/5 pb-6"
              >
                <div className="relative overflow-hidden aspect-[4/5] mb-6">
                  <img
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    src={product.image}
                  />
                  {product.tag && (
                    <div
                      className={`absolute top-4 left-4 ${
                        product.tagColor
                          ? product.tagColor
                          : "gold-gradient text-background-dark"
                      } text-[9px] font-black px-3 py-1 uppercase tracking-widest shadow-xl`}
                    >
                      {product.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <button className="bg-white text-background-dark font-bold px-8 py-3 text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      Detalhes
                    </button>
                  </div>
                </div>
                <div className="px-6">
                  <p className="text-[10px] text-primary font-bold tracking-[0.2em] mb-2 uppercase">
                    {product.category}
                  </p>
                  <h3 className="font-display text-base font-semibold mb-3 group-hover:text-primary transition-colors tracking-wide">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <p className="font-display font-bold text-lg text-white">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                    <span className="material-symbols-outlined text-gray-600 group-hover:text-primary transition-colors font-light">
                      add_shopping_cart
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-background-dark border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 leading-tight">
                O PADRÃO <br />
                <span className="text-gold-gradient">OURO</span> DAS CAMISAS
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed font-light text-lg">
                Não vendemos apenas camisas, entregamos a paixão pelo futebol
                com o máximo de qualidade que o mercado tailandês pode oferecer.
                Cada fibra, cada escudo bordado e cada detalhe de silk é
                inspecionado para garantir que você vista o melhor.
              </p>
              <div className="space-y-6">
                {[
                  {
                    title: "Tecido AeroReady & Dri-FIT",
                    desc: "Tecnologia de ventilação idêntica aos modelos profissionais.",
                  },
                  {
                    title: "Bordados de Alta Definição",
                    desc: "Escudos com relevo e detalhes precisos em cada ponto.",
                  },
                  {
                    title: "Etiquetagem Oficial",
                    desc: "Todos os selos de autenticidade e códigos de barras funcionais.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary mt-1">
                      check_circle
                    </span>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">
                        {item.title}
                      </h4>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 gold-gradient opacity-10 blur-[100px] rounded-full"></div>
              <img
                alt="IG Imports Premium Shield"
                className="relative z-10 w-full max-w-sm h-auto drop-shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:scale-105 transition-transform duration-500"
                src={IMAGES.LOGO}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card-dark text-gray-400 py-24 border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-10">
                <img
                  alt="IG Imports Logo"
                  className="h-10 w-auto"
                  src={IMAGES.LOGO}
                />
                <span className="font-display text-lg font-bold tracking-[0.2em] text-white">
                  IG IMPORTS
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-8 font-light italic">
                "Onde o luxo encontra a paixão pelo futebol. Qualidade Thai 1.1
                sem compromissos."
              </p>
              <div className="flex space-x-6">
                <a
                  className="hover:text-primary transition-all scale-100 hover:scale-110"
                  href="#"
                >
                  <span className="material-symbols-outlined font-light">
                    brand_awareness
                  </span>
                </a>
                <a
                  className="hover:text-primary transition-all scale-100 hover:scale-110"
                  href="#"
                >
                  <span className="material-symbols-outlined font-light">
                    photo_camera
                  </span>
                </a>
                <a
                  className="hover:text-primary transition-all scale-100 hover:scale-110"
                  href="#"
                >
                  <span className="material-symbols-outlined font-light">
                    alternate_email
                  </span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-display font-bold uppercase tracking-[0.2em] text-xs mb-10">
                Categorias
              </h4>
              <ul className="space-y-5 text-xs tracking-widest uppercase font-medium">
                {[
                  "Clubes Europeus",
                  "Seleções Nacionais",
                  "Brasileirão Série A",
                  "Coleção Retro",
                  "Kits Infantis",
                ].map((item) => (
                  <li key={item}>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-display font-bold uppercase tracking-[0.2em] text-xs mb-10">
                Atendimento
              </h4>
              <ul className="space-y-5 text-xs tracking-widest uppercase font-medium">
                {[
                  "Guia de Tamanhos",
                  "Rastrear Pedido",
                  "Dúvidas Frequentes",
                  "Trocas e Devoluções",
                  "Fale Conosco",
                ].map((item) => (
                  <li key={item}>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-display font-bold uppercase tracking-[0.2em] text-xs mb-10">
                Newsletter VIP
              </h4>
              <p className="text-xs mb-8 leading-relaxed font-light">
                Receba em primeira mão os lançamentos e promoções exclusivas
                para membros.
              </p>
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="bg-white/5 border border-white/10 px-6 py-4 text-xs focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                  placeholder="Seu e-mail principal"
                  type="email"
                />
                <button
                  className="gold-gradient text-background-dark font-bold py-4 text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition-all"
                  type="submit"
                >
                  Inscrever-se
                </button>
              </form>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600">
              © 2024 IG IMPORTS. LUXURY SPORTSWEAR.
            </p>
            <div className="flex gap-10 grayscale opacity-40">
              <span className="material-symbols-outlined">payments</span>
              <span className="material-symbols-outlined">credit_card</span>
              <span className="material-symbols-outlined">token</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;