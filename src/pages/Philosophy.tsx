import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Philosophy: React.FC = () => {
    const values = [
        {
            icon: 'checkroom',
            title: 'Camisas Originais 1:1',
            description: 'Cada camisa é selecionada com rigor: tecidos, patches e detalhes idênticos ao produto oficial. Qualidade que você sente ao tocar.'
        },
        {
            icon: 'chat',
            title: 'Disponibilidade pelo WhatsApp',
            description: 'Antes de comprar, verifique a disponibilidade do produto diretamente pelo WhatsApp. Atendimento rápido e personalizado para você.'
        },
        {
            icon: 'inventory_2',
            title: 'Encomendas Sob Pedido',
            description: 'Não achou o clube ou a temporada que procura? Fazemos encomendas personalizadas. Basta descrever e nós buscamos para você.'
        },
        {
            icon: 'public',
            title: 'Clubes do Mundo Todo',
            description: 'Do futebol brasileiro às ligas europeias: Premier League, La Liga, Serie A e muito mais. As camisas dos maiores clubes em um só lugar.'
        }
    ];

    return (
        <div className="bg-background-dark min-h-screen text-slate-100 flex flex-col">
            <Navbar />

            <main className="grow pt-32 pb-20">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-125 h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-125 h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-6 block">Quem Somos</span>
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
                                NOSSA <span className="text-primary">FILOSOFIA</span>
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                                A grandeza não se pede, se veste. Da precisão dos detalhes à 
                                imponência do escudo: a coleção definitiva para quem nasceu para vencer.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-20 bg-white/5">
                    <div className="max-w-480 mx-auto px-6 sm:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                                    NOSSA <span className="text-primary">MISSÃO</span>
                                </h2>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    Ser a maior loja virtual de camisas premium do Brasil, oferecendo produtos 
                                    de qualidade 1:1 com detalhes impecáveis e uma experiência de compra 
                                    única para cada cliente.
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    Acreditamos que vestir a camisa do seu time vai além do futebol. 
                                    É sobre identidade, paixão e fazer parte de algo maior. 
                                    Por isso, selecionamos cada peça com o mesmo cuidado que você 
                                    teria ao escolher.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="relative flex items-center justify-center min-h-80"
                            >
                                {/* Anéis de pulsação */}
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute w-72 h-72 rounded-full border border-primary/30"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.03, 0.12] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                    className="absolute w-88 h-88 rounded-full border border-primary/20"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.35, 1], opacity: [0.07, 0.01, 0.07] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                    className="absolute w-md h-112 rounded-full border border-primary/10"
                                />
                                {/* Logo pulsante */}
                                <motion.img
                                    src="/ig-imports-logo.png"
                                    alt="IG Imports"
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="relative z-10 w-56 h-56 object-contain drop-shadow-[0_0_50px_rgba(212,175,55,0.35)]"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-20">
                    <div className="max-w-480 mx-auto px-6 sm:px-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <span className="text-primary text-xs font-bold tracking-[0.5em] uppercase mb-3 block">O Que Nos Define</span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                                NOSSOS <span className="text-primary">VALORES</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {values.map((value, index) => (
                                <motion.div
                                    key={value.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-card-dark border border-white/5 p-8 hover:border-primary/30 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                                        {value.icon}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-white/5">
                    <div className="max-w-480 mx-auto px-6 sm:px-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center"
                        >
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                                PRONTO PARA VESTIR A <span className="text-primary">GRANDEZA</span>?
                            </h2>
                            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                                Explore nossa coleção exclusiva e encontre a camisa perfeita para você.
                            </p>
                            <Link
                                to="/catalog"
                                className="inline-block bg-primary text-black px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors duration-300"
                            >
                                Ver Catálogo
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Philosophy;
