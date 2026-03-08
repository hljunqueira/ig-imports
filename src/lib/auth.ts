import { apiClient } from './api';

export interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export const authService = {
    /**
     * Sign in with email and password
     */
    async login({ email, password }: LoginCredentials): Promise<AuthUser | null> {
        console.log('[AUTH] Tentando login para:', email);
        
        const response = await apiClient.post<{ success: boolean; token: string; user: AuthUser }>('/auth/login', {
            email,
            password,
        });

        if (!response.success) {
            throw new Error('Login failed');
        }

        // Store token
        localStorage.setItem('token', response.token);

        console.log('[AUTH] Login sucesso, user:', response.user);
        return response.user;
    },

    /**
     * Sign out current user
     */
    async logout(): Promise<void> {
        localStorage.removeItem('token');
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<AuthUser | null> {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await apiClient.get<{ success: boolean; user: AuthUser }>('/auth/me');
            return response.success ? response.user : null;
        } catch (error) {
            console.error('[AUTH] Get current user error:', error);
            localStorage.removeItem('token');
            return null;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    },

    /**
     * Subscribe to auth state changes (simulated with storage event)
     */
    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        // For REST API, we don't have real-time auth state
        // This is a placeholder for compatibility
        const checkAuth = async () => {
            const user = await this.getCurrentUser();
            callback(user);
        };
        
        // Initial check
        checkAuth();

        // Listen for storage changes (logout from other tabs)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'token') {
                checkAuth();
            }
        };
        window.addEventListener('storage', handleStorage);

        return {
            unsubscribe: () => window.removeEventListener('storage', handleStorage),
        };
    },
};
