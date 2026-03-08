import { apiClient } from './api';
import type { StockMovement, Supplier, PurchaseOrder, PurchaseOrderItem } from '../types';

// ========================================
// SERVIÇO DE ESTOQUE AVANÇADO
// ========================================

export const inventoryService = {
    // Movimentações de Estoque
    async getStockMovements(productId?: string): Promise<StockMovement[]> {
        const params = productId ? `?productId=${productId}` : '';
        const response = await apiClient.get<{ success: boolean; data: StockMovement[] }>(`/inventory/movements${params}`);
        return response.success ? response.data : [];
    },

    async createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
        const response = await apiClient.post<{ success: boolean; data: StockMovement }>('/inventory/movements', movement);
        if (!response.success) throw new Error('Failed to create stock movement');
        return response.data;
    },

    async adjustStock(productId: string, newStock: number, reason: string, createdBy?: string): Promise<StockMovement> {
        return this.createStockMovement({
            product_id: productId,
            movement_type: 'adjustment',
            quantity: newStock,
            previous_stock: 0,
            new_stock: newStock,
            reason,
            created_by: createdBy,
        });
    },

    // Produtos com Estoque Baixo
    async getLowStockProducts() {
        const response = await apiClient.get<{ success: boolean; data: any[] }>('/inventory/low-stock');
        return response.success ? response.data : [];
    },

    // Fornecedores
    async getSuppliers(activeOnly = true): Promise<Supplier[]> {
        const params = activeOnly ? '?active=true' : '';
        const response = await apiClient.get<{ success: boolean; data: Supplier[] }>(`/suppliers${params}`);
        return response.success ? response.data : [];
    },

    async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
        const response = await apiClient.post<{ success: boolean; data: Supplier }>('/suppliers', supplier);
        if (!response.success) throw new Error('Failed to create supplier');
        return response.data;
    },

    async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
        const response = await apiClient.put<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, updates);
        if (!response.success) throw new Error('Failed to update supplier');
        return response.data;
    },

    // Pedidos de Compra
    async getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get<{ success: boolean; data: PurchaseOrder[] }>(`/purchase-orders${params}`);
        return response.success ? response.data : [];
    },

    async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: Omit<PurchaseOrderItem, 'id' | 'created_at'>[]): Promise<PurchaseOrder> {
        const response = await apiClient.post<{ success: boolean; data: PurchaseOrder }>('/purchase-orders', { order, items });
        if (!response.success) throw new Error('Failed to create purchase order');
        return response.data;
    },

    async updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status'], actualDelivery?: string): Promise<PurchaseOrder> {
        const response = await apiClient.patch<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}/status`, { status, actualDelivery });
        if (!response.success) throw new Error('Failed to update purchase order status');
        return response.data;
    },

    // Estatísticas
    async getInventoryStats() {
        const response = await apiClient.get<{ success: boolean; data: { totalProducts: number; activeProducts: number; lowStock: number; outOfStock: number; totalStock: number } }>('/inventory/stats');
        return response.success ? response.data : { totalProducts: 0, activeProducts: 0, lowStock: 0, outOfStock: 0, totalStock: 0 };
    },
};
