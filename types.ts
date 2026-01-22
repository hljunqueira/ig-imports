export interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    image: string;
    tag?: string;
    tagColor?: string;
    stock: number;
    status: 'ACTIVE' | 'DRAFT' | 'SOLD_OUT';
}

export interface NavItem {
    label: string;
    href: string;
    active?: boolean;
}

export interface DashboardStat {
    label: string;
    value: string | number;
    icon: string;
    colorClass: string;
    iconColorClass: string;
}