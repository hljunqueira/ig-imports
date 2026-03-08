import { supabase } from './supabase';
import type { StockMovement, Supplier, PurchaseOrder, PurchaseOrderItem } from '../types';

// ========================================
// SERVIÇO DE ESTOQUE AVANÇADO
// ========================================

export const inventoryService = {
    // Movimentações de Estoque
    async getStockMovements(productId?: string) {
        let query = supabase
            .from('stock_movements')
            .select('*, product:products(name, image_url)')
            .order('created_at', { ascending: false });

        if (productId) query = query.eq('product_id', productId);

        const { data, error } = await query;
        return { data: data as (StockMovement & { product: { name: string; image_url: string } })[] | null, error };
    },

    async createStockMovement(movement: Omit<StockMovement, 'id' | 'created_at'>) {
        // Get current stock
        const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', movement.product_id)
            .single();

        if (!product) return { data: null, error: { message: 'Product not found' } };

        const previousStock = product.stock || 0;
        let newStock = previousStock;

        // Calculate new stock based on movement type
        switch (movement.movement_type) {
            case 'in':
            case 'return':
                newStock = previousStock + movement.quantity;
                break;
            case 'out':
                newStock = previousStock - movement.quantity;
                break;
            case 'adjustment':
                newStock = movement.quantity; // Direct set
                break;
        }

        // Create movement record
        const { data: movementData, error: movementError } = await supabase
            .from('stock_movements')
            .insert({
                ...movement,
                previous_stock: previousStock,
                new_stock: newStock,
            })
            .select()
            .single();

        if (movementError) return { data: null, error: movementError };

        // Update product stock
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', movement.product_id);

        if (updateError) return { data: null, error: updateError };

        return { data: movementData as StockMovement, error: null };
    },

    async adjustStock(productId: string, newStock: number, reason: string, createdBy?: string) {
        return this.createStockMovement({
            product_id: productId,
            movement_type: 'adjustment',
            quantity: newStock,
            previous_stock: 0, // Will be calculated
            new_stock: newStock,
            reason,
            created_by: createdBy,
        });
    },

    // Produtos com Estoque Baixo
    async getLowStockProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .lt('stock', 5) // Default threshold, can be customized
            .eq('status', 'active')
            .order('stock', { ascending: true });

        return { data, error };
    },

    // Fornecedores
    async getSuppliers(activeOnly = true) {
        let query = supabase.from('suppliers').select('*').order('name');

        if (activeOnly) query = query.eq('is_active', true);

        const { data, error } = await query;
        return { data: data as Supplier[] | null, error };
    },

    async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert(supplier)
            .select()
            .single();
        return { data: data as Supplier | null, error };
    },

    async updateSupplier(id: string, updates: Partial<Supplier>) {
        const { data, error } = await supabase
            .from('suppliers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data: data as Supplier | null, error };
    },

    // Pedidos de Compra
    async getPurchaseOrders(status?: string) {
        let query = supabase
            .from('purchase_orders')
            .select('*, supplier:suppliers(name), items:purchase_order_items(*, product:products(name, image_url))')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        return { data: data as PurchaseOrder[] | null, error };
    },

    async getPurchaseOrderById(id: string) {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*, supplier:suppliers(*), items:purchase_order_items(*, product:products(*))')
            .eq('id', id)
            .single();

        return { data: data as PurchaseOrder | null, error };
    },

    async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: Omit<PurchaseOrderItem, 'id' | 'created_at'>[]) {
        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + item.total_cost, 0);

        // Create order
        const { data: orderData, error: orderError } = await supabase
            .from('purchase_orders')
            .insert({ ...order, total_amount: totalAmount })
            .select()
            .single();

        if (orderError) return { data: null, error: orderError };

        // Create items
        const itemsWithOrderId = items.map((item) => ({
            ...item,
            purchase_order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsWithOrderId);

        if (itemsError) return { data: null, error: itemsError };

        return { data: orderData as PurchaseOrder, error: null };
    },

    async updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status'], actualDelivery?: string) {
        const updates: Partial<PurchaseOrder> = { status };
        if (actualDelivery) updates.actual_delivery = actualDelivery;

        const { data, error } = await supabase
            .from('purchase_orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        // If received, update stock
        if (status === 'received') {
            const { data: order } = await supabase
                .from('purchase_orders')
                .select('items:purchase_order_items(*)')
                .eq('id', id)
                .single();

            if (order?.items) {
                for (const item of order.items) {
                    await this.createStockMovement({
                        product_id: item.product_id,
                        movement_type: 'in',
                        quantity: item.quantity,
                        previous_stock: 0,
                        new_stock: 0,
                        reason: `Recebimento do pedido de compra #${id}`,
                    });
                }
            }
        }

        return { data: data as PurchaseOrder | null, error };
    },

    // Estatísticas
    async getInventoryStats() {
        const { data: products, error } = await supabase.from('products').select('stock, status, min_stock');

        if (error) return { data: null, error };

        const stats = {
            totalProducts: products?.length || 0,
            activeProducts: 0,
            lowStock: 0,
            outOfStock: 0,
            totalStock: 0,
        };

        products?.forEach((p) => {
            if (p.status === 'active') stats.activeProducts++;
            if (p.stock === 0) stats.outOfStock++;
            else if (p.stock <= (p.min_stock || 5)) stats.lowStock++;
            stats.totalStock += p.stock || 0;
        });

        return { data: stats, error: null };
    },
};
