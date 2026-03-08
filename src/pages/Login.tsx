import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={IMAGES.HERO_BG}
          alt="Background"
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background-dark via-background-dark/90 to-background-dark"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-10">
          <img src={IMAGES.LOGO} alt="IG Imports" className="h-20 w-auto mx-auto mb-6 drop-shadow-lg" />
          <h2 className="font-display text-3xl font-bold text-gold-gradient tracking-[0.2em] mb-3">ÁREA RESTRITA</h2>
          <p className="text-gray-500 text-[10px] tracking-[0.4em] uppercase font-bold">Gestão Administrativa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-xl bg-card-dark/60 p-10 border border-white/5 shadow-2xl relative overflow-hidden rounded-sm">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-primary to-transparent opacity-70"></div>

          <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-xs text-center rounded">
              {error}
            </div>
          )}

          <div className="space-y-2 relative z-10">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1">E-mail</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-500 text-lg group-focus-within:text-primary transition-colors">person</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark/80 border border-white/10 py-3.5 pl-12 pr-4 text-xs text-white placeholder-gray-700 focus:border-primary/60 outline-none transition-all focus:bg-background-dark"
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Senha de Acesso</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-500 text-lg group-focus-within:text-primary transition-colors">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark/80 border border-white/10 py-3.5 pl-12 pr-4 text-xs text-white placeholder-gray-700 focus:border-primary/60 outline-none transition-all focus:bg-background-dark"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full gold-gradient text-background-dark font-bold py-4 text-[11px] uppercase tracking-[0.3em] hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all mt-4 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                Entrando...
              </span>
            ) : (
              <span className="relative z-10">Acessar Sistema</span>
            )}
          </button>

          <div className="text-center mt-8 relative z-10">
            <Link to="/" className="text-[10px] text-gray-600 hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Voltar para Loja
            </Link>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-gray-700 uppercase tracking-widest">© 2024 IG Imports Security System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;