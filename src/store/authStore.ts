import { create } from 'zustand';
import { authService, AuthUser } from '../lib/auth';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasCheckedAuth: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

// Flag fora do store para evitar chamadas simultâneas (React StrictMode monta 2x)
let checkAuthInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    hasCheckedAuth: false,

    login: async (email: string, password: string) => {
        console.log('[AUTH_STORE] Iniciando login...');
        set({ isLoading: true });
        try {
            const user = await authService.login({ email, password });
            console.log('[AUTH_STORE] Login sucesso:', user);
            set({ user, isAuthenticated: !!user, isLoading: false, hasCheckedAuth: true });
        } catch (error) {
            console.error('[AUTH_STORE] Login erro:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        checkAuthInFlight = null;
        await authService.logout();
        set({ user: null, isAuthenticated: false, isLoading: false, hasCheckedAuth: false });
    },

    checkAuth: async () => {
        // Já verificado — não fazer novamente
        if (get().hasCheckedAuth) {
            console.log('[AUTH_STORE] Auth já verificado, pulando...');
            return;
        }

        // Já em andamento — aguarda o mesmo promise (evita dupla chamada no StrictMode)
        if (checkAuthInFlight) {
            console.log('[AUTH_STORE] Auth em andamento, aguardando...');
            return checkAuthInFlight;
        }

        console.log('[AUTH_STORE] Verificando auth...');
        set({ isLoading: true });

        checkAuthInFlight = (async () => {
            try {
                const user = await authService.getCurrentUser();
                console.log('[AUTH_STORE] Auth check resultado:', user ? 'autenticado' : 'não autenticado');
                set({ user, isAuthenticated: !!user, isLoading: false, hasCheckedAuth: true });
            } catch (error) {
                console.error('[AUTH_STORE] Auth check erro:', error);
                set({ user: null, isAuthenticated: false, isLoading: false, hasCheckedAuth: true });
            } finally {
                checkAuthInFlight = null;
            }
        })();

        return checkAuthInFlight;
    },
}));
