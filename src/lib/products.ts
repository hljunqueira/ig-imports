import { apiClient } from './api';

// ========================================
// TYPES
// ========================================

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    original_price?: number;
    category_id?: string;
    category?: Category;
    image_url?: string;
    gallery?: string[];
    sizes?: string[];
    stock: number;
    status: 'active' | 'draft' | 'sold_out' | 'archived';
    is_featured: boolean;
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
}

export interface ProductInput {
    name: string;
    slug: string;
    description?: string;
    price: number;
    original_price?: number;
    category_id?: string;
    image_url?: string;
    gallery?: string[];
    sizes?: string[];
    stock?: number;
    status?: 'active' | 'draft' | 'sold_out' | 'archived';
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
}

// ========================================
// CATEGORY SERVICE
// ========================================

export const categoryService = {
    async getAll(): Promise<Category[]> {
        const response = await apiClient.get<{ success: boolean; data: Category[] }>('/categories');
        return response.success ? response.data : [];
    },

    async getById(id: string): Promise<Category | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: Category }>(`/categories/${id}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async create(category: Partial<Category>): Promise<Category> {
        const response = await apiClient.post<{ success: boolean; data: Category }>('/categories', category);
        if (!response.success) throw new Error('Failed to create category');
        return response.data;
    },

    async update(id: string, category: Partial<Category>): Promise<Category> {
        const response = await apiClient.put<{ success: boolean; data: Category }>(`/categories/${id}`, category);
        if (!response.success) throw new Error('Failed to update category');
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};

// ========================================
// PRODUCT SERVICE
// ========================================

export const productService = {
    async getAll(options?: {
        categoryId?: string;
        status?: string;
        search?: string;
        featured?: boolean;
    }): Promise<Product[]> {
        const params = new URLSearchParams();
        if (options?.categoryId) params.append('category', options.categoryId);
        if (options?.status) params.append('status', options.status);
        if (options?.search) params.append('search', options.search);
        if (options?.featured) params.append('featured', 'true');

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<{ success: boolean; data: Product[] }>(`/products${query}`);
        return response.success ? response.data : [];
    },

    async getBySlug(slug: string): Promise<Product | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: Product }>(`/products/slug/${slug}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async getById(id: string): Promise<Product | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async create(product: ProductInput): Promise<Product> {
        const response = await apiClient.post<{ success: boolean; data: Product }>('/products', product);
        if (!response.success) throw new Error('Failed to create product');
        return response.data;
    },

    async update(id: string, product: Partial<ProductInput>): Promise<Product> {
        const response = await apiClient.put<{ success: boolean; data: Product }>(`/products/${id}`, product);
        if (!response.success) throw new Error('Failed to update product');
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/products/${id}`);
    },

    async uploadImage(file: File, folder: string = 'products'): Promise<string> {
        // Upload via FormData para a API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        return data.url || '';
    },
};
