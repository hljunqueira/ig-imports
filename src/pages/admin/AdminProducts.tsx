import React, { useState, useEffect } from 'react';
import { Product, productService, Category, categoryService } from '../../lib/products';
import Modal from '../../components/Modal';
import { useDialog } from '../../context/DialogContext';

// Helper para construir URL completa da imagem
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/ig-imports-logo.png';
  // Se já for URL absoluta (http/https), retorna como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Se for caminho relativo, adiciona a base da API
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const AdminProducts: React.FC = () => {
    const { error } = useDialog();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        original_price: '',
        category_id: '',
        image_url: '',
        sizes: [] as string[],
        stock: '0',
        status: 'active' as 'active' | 'draft' | 'sold_out',
        is_featured: false,
    });

    const availableSizes = ['P', 'M', 'G', 'GG', 'XGG', 'XXGG', 'G1', 'G2', 'G3'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll(),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                slug: product.slug || '',
                description: product.description || '',
                price: product.price.toString(),
                original_price: product.original_price?.toString() || '',
                category_id: product.category_id || '',
                image_url: product.image_url || '',
                sizes: product.sizes || [],
                stock: product.stock.toString(),
                status: product.status,
                is_featured: product.is_featured,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                price: '',
                original_price: '',
                category_id: '',
                image_url: '',
                sizes: [],
                stock: '0',
                status: 'active',
                is_featured: false,
            });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const imageUrl = await productService.uploadImage(file);
            setFormData({ ...formData, image_url: imageUrl });
        } catch (err) {
            console.error('Error uploading image:', err);
            await error('Erro ao fazer upload da imagem');
        } finally {
            setUploading(false);
        }
    };

    const toggleSize = (size: string) => {
        const sizes = formData.sizes.includes(size)
            ? formData.sizes.filter(s => s !== size)
            : [...formData.sizes, size];
        setFormData({ ...formData, sizes });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const slug = formData.slug || generateSlug(formData.name);
            const productData = {
                name: formData.name,
                slug,
                description: formData.description,
                price: parseFloat(formData.price),
                original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
                category_id: formData.category_id || undefined,
                image_url: formData.image_url || undefined,
                sizes: formData.sizes,
                stock: parseInt(formData.stock) || 0,
                status: formData.status,
                is_featured: formData.is_featured,
            };

            if (editingProduct) {
                await productService.update(editingProduct.id, productData);
            } else {
                await productService.create(productData);
            }

            await loadData();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving product:', err);
            await error('Erro ao salvar produto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product: Product) => {
        try {
            await productService.delete(product.id);
            await loadData();
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting product:', err);
            await error('Erro ao excluir produto');
        }
    };

    const filteredProducts = products.filter(product => {
        if (filterCategory && product.category_id !== filterCategory) return false;
        if (filterStatus && product.status !== filterStatus) return false;
        if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-500';
            case 'draft': return 'text-amber-500';
            case 'sold_out': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'draft': return 'Rascunho';
            case 'sold_out': return 'Esgotado';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex gap-4">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-background-dark border border-white/10 text-[11px] uppercase tracking-widest px-4 py-2.5 outline-none focus:border-primary w-48 transition-colors"
                    >
                        <option value="">Todas Categorias</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-background-dark border border-white/10 text-[11px] uppercase tracking-widest px-4 py-2.5 outline-none focus:border-primary w-40 transition-colors"
                    >
                        <option value="">Todos Status</option>
                        <option value="active">Ativo</option>
                        <option value="draft">Rascunho</option>
                        <option value="sold_out">Esgotado</option>
                    </select>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Novo Produto
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    search
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none transition-all placeholder:text-gray-600"
                />
            </div>

            {/* Products Table */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary w-24">Imagem</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Produto</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Categoria</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Preço</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Estoque</th>
                                <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="w-16 h-20 bg-card-dark border border-white/5 overflow-hidden">
                                            <img
                                                src={getImageUrl(product.image_url)}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-semibold tracking-wide">{product.name}</p>
                                        <span className={`text-[9px] ${getStatusColor(product.status)} uppercase font-bold tracking-widest`}>
                                            {getStatusLabel(product.status)}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                            {product.category?.name || 'Sem Categoria'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-display font-bold">{formatCurrency(product.price)}</p>
                                        {product.original_price && (
                                            <p className="text-[10px] text-gray-500 line-through">
                                                {formatCurrency(product.original_price)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className={`flex items-center gap-2 ${product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-amber-500' : ''}`}>
                                            <span className="text-sm font-semibold">{product.stock}</span>
                                            <span className="text-[9px] text-gray-600 uppercase">un</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(product)}
                                                className="p-2 hover:bg-white/5 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Nenhum produto encontrado</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Nome *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    if (!editingProduct) {
                                        setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                                    }
                                }}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Categoria
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="">Sem categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Preço *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Preço Original (para desconto)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.original_price}
                                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Estoque *
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Sizes */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Tamanhos Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableSizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => toggleSize(size)}
                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${
                                        formData.sizes.includes(size)
                                            ? 'bg-primary text-background-dark border-primary'
                                            : 'border-white/20 text-gray-400 hover:border-primary'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Imagem do Produto
                        </label>
                        <div className="flex gap-4 items-start">
                            <div className="w-24 h-32 bg-card-dark border border-white/5 overflow-hidden shrink-0">
                                {formData.image_url ? (
                                    <img
                                        src={getImageUrl(formData.image_url)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-gray-600">image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors cursor-pointer"
                                >
                                    {uploading ? (
                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-sm">upload</span>
                                    )}
                                    {uploading ? 'Enviando...' : 'Upload'}
                                </label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="Ou cole a URL da imagem"
                                    className="w-full bg-background-dark border border-white/10 px-4 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status and Featured */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="active">Ativo</option>
                                <option value="draft">Rascunho</option>
                                <option value="sold_out">Esgotado</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-5 h-5 bg-background-dark border border-white/10 text-primary focus:ring-primary"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Destacado na Home
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirmar Exclusão"
                size="sm"
            >
                <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">warning</span>
                    <p className="text-gray-300 mb-2">Tem certeza que deseja excluir o produto</p>
                    <p className="text-lg font-bold mb-6">"{deleteConfirm?.name}"</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            className="flex-1 bg-red-500 text-white px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-colors"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminProducts;
