// API client for Node.js backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Traduz erros HTTP para português
const HTTP_ERRORS: Record<number, string> = {
    400: 'Requisição inválida. Verifique os dados enviados.',
    401: 'Credenciais inválidas. Verifique e-mail e senha.',
    403: 'Acesso negado. Você não tem permissão para esta ação.',
    404: 'Recurso não encontrado.',
    409: 'Conflito: este registro já existe.',
    422: 'Dados inválidos. Verifique os campos obrigatórios.',
    429: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Servidor indisponível. Tente novamente em instantes.',
    503: 'Serviço temporariamente fora do ar. Tente mais tarde.',
};

async function handleError(response: Response): Promise<never> {
    const translated = HTTP_ERRORS[response.status];
    if (translated) throw new Error(translated);

    // Tenta extrair mensagem do corpo JSON
    try {
        const body = await response.json();
        const msg = body?.message || body?.error || body?.msg;
        if (msg) throw new Error(translateApiMessage(msg));
    } catch (e) {
        if (e instanceof Error && e.message !== '') throw e;
    }

    throw new Error(`Erro inesperado (código ${response.status}). Tente novamente.`);
}

// Traduz mensagens em inglês comuns vindas da API
function translateApiMessage(msg: string): string {
    const translations: Record<string, string> = {
        'Too many requests, please try again later.': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'Too many requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'Unauthorized': 'Não autorizado. Faça login novamente.',
        'Forbidden': 'Acesso negado.',
        'Not found': 'Recurso não encontrado.',
        'Invalid credentials': 'E-mail ou senha incorretos.',
        'User not found': 'Usuário não encontrado.',
        'Email already exists': 'Este e-mail já está cadastrado.',
        'Invalid token': 'Sessão expirada. Faça login novamente.',
        'Token expired': 'Sessão expirada. Faça login novamente.',
        'Internal server error': 'Erro interno do servidor. Tente novamente mais tarde.',
        'Bad request': 'Requisição inválida.',
        'Validation error': 'Dados inválidos. Verifique os campos.',
        'Login failed': 'E-mail ou senha incorretos.',
    };

    for (const [en, pt] of Object.entries(translations)) {
        if (msg.toLowerCase().includes(en.toLowerCase())) return pt;
    }

    return msg;
}

// Generic fetch wrapper
export const apiClient = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
        });
        if (!response.ok) await handleError(response);
        return response.json();
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) await handleError(response);
        return response.json();
    },

    async put<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) await handleError(response);
        return response.json();
    },

    async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) await handleError(response);
        return response.json();
    },

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
        });
        if (!response.ok) await handleError(response);
        return response.json();
    },
};

