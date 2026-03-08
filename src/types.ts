// ========================================
// IG Imports - TypeScript Types
// ========================================

// ========================================
// 1. TIPOS BASE (Produtos, Pedidos)
// ========================================

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    original_price?: number;
    category_id?: string;
    category?: Category;
    image_url?: string;
    gallery?: string[];
    sizes?: string[];
    stock: number;
    min_stock?: number;
    status: 'active' | 'draft' | 'sold_out' | 'discontinued';
    is_featured?: boolean;
    tags?: string[];
    supplier_id?: string;
    cost_price?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface Order {
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_type: 'pickup' | 'delivery';
    address?: string;
    total: number;
    status: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
    payment_method?: string;
    notes?: string;
    items?: OrderItem[];
    created_at?: string;
    updated_at?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    product_image?: string;
    size?: string;
    quantity: number;
    unit_price: number;
    created_at?: string;
}

// ========================================
// 2. MÓDULO FINANCEIRO
// ========================================

export interface FinancialTransaction {
    id: string;
    transaction_type: 'income' | 'expense' | 'refund' | 'adjustment';
    category: string;
    amount: number;
    description?: string;
    related_order_id?: string;
    related_product_id?: string;
    payment_method?: string;
    payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transaction_date: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AccountReceivable {
    id: string;
    order_id?: string;
    customer_name: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AccountPayable {
    id: string;
    supplier_id?: string;
    description: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    category?: string;
    created_at?: string;
    updated_at?: string;
}

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'income' | 'expense';
    is_active: boolean;
    created_at?: string;
}

// ========================================
// 3. SISTEMA DE FEEDBACKS
// ========================================

export interface ProductReview {
    id: string;
    product_id: string;
    customer_name: string;
    customer_email?: string;
    rating: number;
    title?: string;
    comment?: string;
    is_approved: boolean;
    is_featured: boolean;
    helpful_count: number;
    order_id?: string;
    replies?: ReviewReply[];
    created_at?: string;
    updated_at?: string;
}

export interface ReviewReply {
    id: string;
    review_id: string;
    reply_text: string;
    replied_by?: string;
    created_at?: string;
}

// ========================================
// 4. SISTEMA DE ENCOMENDAS
// ========================================

export interface ProductRequest {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    product_description: string;
    preferred_brand?: string;
    preferred_size?: string;
    quantity: number;
    max_budget?: number;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'reviewing' | 'quoted' | 'approved' | 'ordered' | 'available' | 'cancelled' | 'rejected';
    admin_notes?: string;
    quoted_price?: number;
    quoted_at?: string;
    handled_by?: string;
    status_history?: RequestStatusHistory[];
    created_at?: string;
    updated_at?: string;
}

export interface RequestStatusHistory {
    id: string;
    request_id: string;
    old_status?: string;
    new_status: string;
    changed_by?: string;
    notes?: string;
    created_at?: string;
}

// ========================================
// 5. CONTROLE DE ESTOQUE AVANÇADO
// ========================================

export interface StockMovement {
    id: string;
    product_id: string;
    movement_type: 'in' | 'out' | 'adjustment' | 'return' | 'transfer';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reason?: string;
    reference_order_id?: string;
    reference_request_id?: string;
    created_by?: string;
    created_at?: string;
    product?: Product;
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PurchaseOrder {
    id: string;
    supplier_id?: string;
    supplier?: Supplier;
    status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
    total_amount?: number;
    expected_delivery?: string;
    actual_delivery?: string;
    notes?: string;
    items?: PurchaseOrderItem[];
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    product_id?: string;
    product?: Product;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    received_quantity: number;
    created_at?: string;
}

// ========================================
// 6. RELATÓRIOS E MÉTRICAS
// ========================================

export interface DailyMetrics {
    id: string;
    metric_date: string;
    total_orders: number;
    total_revenue: number;
    total_expenses: number;
    new_customers: number;
    products_sold: number;
    average_order_value: number;
    created_at?: string;
    updated_at?: string;
}

export interface SystemAlert {
    id: string;
    alert_type: 'low_stock' | 'overdue_payment' | 'new_request' | 'review_pending' | 'expense_high';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description?: string;
    related_id?: string;
    related_table?: string;
    is_read: boolean;
    read_by?: string;
    read_at?: string;
    created_at?: string;
}

// ========================================
// 7. COMPONENTES UI
// ========================================

export interface NavItem {
    label: string;
    href: string;
    active?: boolean;
    children?: { label: string; href: string }[];
}

export interface DashboardStat {
    label: string;
    value: string | number;
    icon: string;
    colorClass: string;
    iconColorClass: string;
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        borderWidth?: number;
    }[];
}

// ========================================
// 8. TIPOS DE FILTRO E PAGINAÇÃO
// ========================================

export interface FilterOptions {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
    page: number;
    limit: number;
    total?: number;
}

// ========================================
// 9. RESPOSTAS DA API
// ========================================

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    count?: number;
}

export interface DashboardSummary {
    todayRevenue: number;
    todayOrders: number;
    pendingOrders: number;
    lowStockProducts: number;
    pendingRequests: number;
    overdueReceivables: number;
}