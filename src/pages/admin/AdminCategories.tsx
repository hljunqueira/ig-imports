import React, { useState, useEffect } from 'react';
import { Category, categoryService, productService } from '../../lib/products';
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const API_BASE = API_URL.replace(/\/api$/, '');
  return `${API_BASE}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const AdminCategories: React.FC = () => {
    const { error } = useDialog();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image_url: '',
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            // Get all categories including inactive for admin
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
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

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                image_url: category.image_url || '',
                is_active: category.is_active,
                sort_order: category.sort_order,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                image_url: '',
                is_active: true,
                sort_order: 0,
            });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            image_url: '',
            is_active: true,
            sort_order: 0,
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const imageUrl = await productService.uploadImage(file, 'categories');
            setFormData(prev => ({ ...prev, image_url: imageUrl }));
        } catch (err) {
            console.error('Error uploading image:', err);
            await error('Erro ao fazer upload da imagem');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const slug = formData.slug || generateSlug(formData.name);
            
            if (editingCategory) {
                await categoryService.update(editingCategory.id, {
                    ...formData,
                    slug,
                });
            } else {
                await categoryService.create({
                    ...formData,
                    slug,
                });
            }

            await loadCategories();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving category:', err);
            await error('Erro ao salvar categoria');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: Category) => {
        try {
            await categoryService.delete(category.id);
            await loadCategories();
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting category:', err);
            await error('Erro ao excluir categoria. Verifique se há produtos vinculados.');
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
            <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                    {categories.length} categorias cadastradas
                </p>
                <button
                    onClick={() => handleOpenModal()}
                    className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Nova Categoria
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="glass-panel p-6 group hover:border-primary/20 transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-16 h-16 bg-card-dark border border-white/5 overflow-hidden">
                                {category.image_url ? (
                                    <img
                                        src={getImageUrl(category.image_url)}
                                        alt={category.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-2xl text-gray-600">category</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(category)}
                                    className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(category)}
                                    className="p-2 hover:bg-white/5 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <h3 className="text-sm font-semibold mb-1">{category.name}</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
                            {category.slug}
                        </p>

                        <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                category.is_active
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : 'bg-gray-500/20 text-gray-500'
                            }`}>
                                {category.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Ordem: {category.sort_order}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">category</span>
                    <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="text-primary hover:underline text-sm"
                    >
                        Criar primeira categoria
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
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
                                if (!editingCategory) {
                                    setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                                }
                            }}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="Ex: Premier League"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Slug (URL)
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            placeholder="premier-league"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Gerado automaticamente do nome</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            Imagem da Categoria
                        </label>
                        <p className="text-[10px] text-gray-500 mb-3">
                            Tamanho recomendado: <span className="text-primary font-bold">400 × 400 px</span> (quadrada) — formatos JPG ou PNG, máx. 2 MB.
                            A imagem será exibida em formato 1:1 no site.
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            {/* Preview quadrado 1:1 */}
                            <div className="w-32 h-32 bg-card-dark border border-white/10 overflow-hidden">
                                {formData.image_url ? (
                                    <img
                                        src={getImageUrl(formData.image_url)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-3xl text-gray-600">image</span>
                                        <span className="text-[10px] text-gray-600 text-center leading-tight px-1">400×400 px</span>
                                    </div>
                                )}
                            </div>
                            {/* Upload button */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="category-image-upload"
                            />
                            <label
                                htmlFor="category-image-upload"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                                {uploading ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm">upload</span>
                                )}
                                {uploading ? 'Enviando...' : 'Upload Imagem'}
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Ordem
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.is_active ? 'active' : 'inactive'}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="active">Ativa</option>
                                <option value="inactive">Inativa</option>
                            </select>
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
                            {saving ? 'Salvando...' : 'Salvar'}
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
                    <p className="text-gray-300 mb-2">
                        Tem certeza que deseja excluir a categoria
                    </p>
                    <p className="text-lg font-bold mb-6">"{deleteConfirm?.name}"</p>
                    <p className="text-xs text-gray-500 mb-6">
                        Esta ação não pode ser desfeita. Produtos vinculados ficarão sem categoria.
                    </p>
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

export default AdminCategories;
