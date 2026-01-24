import React, { useState } from 'react';
import { IMAGES, MOCK_PRODUCTS } from '../constants';
import { DashboardStat } from '../types';

const AdminDashboard: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState<DashboardStat[]>([
    { label: "Total de Itens", value: 142, icon: "app_registration", colorClass: "text-white", iconColorClass: "text-primary/40" },
    { label: "Em Estoque", value: "1.205", icon: "inventory", colorClass: "text-white", iconColorClass: "text-emerald-500/40" },
    { label: "Baixo Estoque", value: 12, icon: "warning", colorClass: "text-red-500", iconColorClass: "text-red-500/40" },
    { label: "Categorias Ativas", value: "08", icon: "category", colorClass: "text-white", iconColorClass: "text-primary/40" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'text-emerald-500';
        case 'DRAFT': return 'text-amber-500';
        case 'SOLD_OUT': return 'text-red-500';
        default: return 'text-gray-500';
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'Ativo';
        case 'DRAFT': return 'Rascunho';
        case 'SOLD_OUT': return 'Esgotado';
        default: return status;
    }
  }

  return (
    <div className="min-h-screen flex bg-background-dark text-slate-100 font-sans">
      <aside className="w-64 bg-sidebar-dark border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img
              alt="IG Imports Logo"
              className="h-10 w-auto"
              src={IMAGES.LOGO}
            />
            <span className="font-display text-sm font-bold tracking-[0.2em] text-gold-gradient">
              IG ADMIN
            </span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <a
            className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Dashboard
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-primary bg-primary/5 border-l-2 border-primary text-xs font-bold uppercase tracking-widest"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">
              inventory_2
            </span>
            Produtos
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">
              shopping_cart
            </span>
            Pedidos
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">group</span>
            Clientes
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            Relatórios
          </a>
        </nav>
        <div className="p-6 border-t border-white/5">
          <a
            className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest"
            href="#"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sair
          </a>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-background-dark/50 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-widest">
              GESTÃO DE <span className="text-gold-gradient">PRODUTOS</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
              Controle de inventário e catálogo
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                search
              </span>
              <input
                className="bg-white/5 border-white/10 border text-xs py-2.5 pl-10 pr-4 w-64 focus:border-primary outline-none transition-all placeholder:text-gray-600 uppercase tracking-widest"
                placeholder="Buscar produto..."
                type="text"
              />
            </div>
            <button className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-base">add</span>
              Adicionar Novo Produto
            </button>
          </div>
        </header>
        <section className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, index) => (
                <div key={index} className="bg-card-dark border border-white/5 p-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                  {stat.label}
                </p>
                <div className="flex items-center justify-between">
                  <h4 className={`text-3xl font-display font-bold ${stat.colorClass}`}>
                    {stat.value}
                  </h4>
                  <span className={`material-symbols-outlined ${stat.iconColorClass}`}>
                    {stat.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-panel p-8">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-8">
              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Categoria
                  </label>
                  <select className="bg-background-dark border border-white/10 text-[11px] uppercase tracking-widest px-4 py-2.5 outline-none focus:border-primary w-48 transition-colors">
                    <option>Todas as Categorias</option>
                    <option>Premier League</option>
                    <option>La Liga</option>
                    <option>Seleções</option>
                    <option>Brasileirão</option>
                    <option>Retro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                    Status
                  </label>
                  <select className="bg-background-dark border border-white/10 text-[11px] uppercase tracking-widest px-4 py-2.5 outline-none focus:border-primary w-40 transition-colors">
                    <option>Todos</option>
                    <option>Ativo</option>
                    <option>Esgotado</option>
                    <option>Rascunho</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Exibindo 10 de 142 produtos
                </span>
                <div className="flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary text-background-dark font-bold text-[10px]">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-primary transition-colors text-[10px]">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center border border-white/10 hover:border-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary w-24">
                      Miniatura
                    </th>
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Produto
                    </th>
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Categoria
                    </th>
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Preço
                    </th>
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Estoque
                    </th>
                    <th className="pb-6 text-[10px] font-bold uppercase tracking-widest text-primary text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_PRODUCTS.map((product) => (
                    <tr key={product.id} className="luxury-table-row transition-colors group">
                      <td className="py-5">
                        <div className="w-16 h-20 bg-card-dark border border-white/5 overflow-hidden">
                          <img
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            src={product.image}
                          />
                        </div>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-semibold tracking-wide">
                          {product.name}
                        </p>
                        <span className={`text-[9px] ${getStatusColor(product.status)} uppercase font-bold tracking-widest`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="py-5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-display font-bold">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </p>
                      </td>
                      <td className="py-5">
                        <div className={`flex items-center gap-2 ${product.stock === 0 ? 'text-red-500' : ''}`}>
                          <span className="text-sm font-semibold">{product.stock}</span>
                          <span className="text-[9px] text-gray-600 uppercase">
                            unidades
                          </span>
                        </div>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all rounded">
                            <span className="material-symbols-outlined text-lg">
                              edit
                            </span>
                          </button>
                          <button className="p-2 hover:bg-white/5 text-gray-400 hover:text-red-500 transition-all rounded">
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
              <button className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  file_download
                </span>
                Exportar CSV
              </button>
              <div className="flex gap-4">
                <button className="px-6 py-2 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors">
                  Anterior
                </button>
                <button className="px-6 py-2 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors">
                  Próxima
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 right-0 p-4 z-50 pointer-events-none">
        <p className="text-[8px] tracking-[0.3em] uppercase text-gray-700">
          © 2024 IG IMPORTS ADMIN PANEL. LUXURY MANAGEMENT SYSTEM.
        </p>
      </footer>
    </div>
  );
};

export default AdminDashboard;