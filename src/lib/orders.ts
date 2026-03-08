import { apiClient } from './api';

// ========================================
// TYPES
// ========================================

export interface OrderItem {
    id?: string;
    product_id: string;
    product_name: string;
    product_image?: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

export interface Order {
    id?: string;
    order_number?: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_type: 'pickup' | 'delivery';
    address?: string;
    total: number;
    status?: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
    notes?: string;
    items: OrderItem[];
    created_at?: string;
}

// ========================================
// ORDER SERVICE
// ========================================

export const orderService = {
    async create(order: Omit<Order, 'id' | 'order_number' | 'created_at'>): Promise<Order> {
        const response = await apiClient.post<{ success: boolean; data: Order }>('/orders', order);
        if (!response.success) throw new Error('Erro ao criar pedido');
        return response.data;
    },

    async getAll(): Promise<Order[]> {
        const response = await apiClient.get<{ success: boolean; data: Order[] }>('/orders');
        return response.success ? response.data : [];
    },

    async getById(id: string): Promise<Order | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`);
            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    async updateStatus(id: string, status: Order['status']): Promise<void> {
        await apiClient.put(`/orders/${id}/status`, { status });
    },
};

// ========================================
// WHATSAPP INTEGRATION
// ========================================

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

export const generateWhatsAppLink = (order: Order): string => {
    const items = order.items
        .map(item => `• ${item.product_name}${item.size ? ` - Tam ${item.size}` : ''} (x${item.quantity}) - R$ ${(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}`)
        .join('\n');

    const deliveryText = order.delivery_type === 'pickup'
        ? '🏪 Retirada na loja'
        : `🚗 Entrega - ${order.address || 'Endereço a combinar'}`;

    const message = `🛒 *Novo Pedido - IG Imports*

📋 *Pedido #${order.order_number || 'Novo'}*

*Cliente:* ${order.customer_name}
*Telefone:* ${order.customer_phone}
${order.customer_email ? `*E-mail:* ${order.customer_email}` : ''}

${deliveryText}

*Itens:*
${items}

💰 *Total: R$ ${order.total.toFixed(2).replace('.', ',')}*

✅ Pagamento na retirada/entrega
${order.notes ? `\n📝 *Observações:* ${order.notes}` : ''}`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
