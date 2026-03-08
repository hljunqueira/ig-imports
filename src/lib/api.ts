// API client for Node.js backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Generic fetch wrapper
export const apiClient = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
            },
        });
        if (!response.ok) throw new Error(await response.text());
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
        if (!response.ok) throw new Error(await response.text());
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
        if (!response.ok) throw new Error(await response.text());
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
        if (!response.ok) throw new Error(await response.text());
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
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
};
