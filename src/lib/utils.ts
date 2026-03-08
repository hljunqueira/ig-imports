// ========================================
// UTILITÁRIOS COMPARTILHADOS
// ========================================

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const getStatusStyles = (status: string): { bg: string; text: string; label: string } => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: 'bg-amber-500/20', text: 'text-amber-500', label: 'Pendente' },
        confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Confirmado' },
        ready: { bg: 'bg-purple-500/20', text: 'text-purple-500', label: 'Pronto' },
        delivered: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', label: 'Entregue' },
        cancelled: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Cancelado' },
    };
    return styles[status] || { bg: 'bg-gray-500/20', text: 'text-gray-500', label: status };
};

export const getProductStatusColor = (status: string): string => {
    switch (status) {
        case 'active': return 'text-emerald-500';
        case 'draft': return 'text-amber-500';
        case 'sold_out': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

export const getProductStatusLabel = (status: string): string => {
    switch (status) {
        case 'active': return 'Ativo';
        case 'draft': return 'Rascunho';
        case 'sold_out': return 'Esgotado';
        default: return status;
    }
};
