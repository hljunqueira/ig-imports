import React, { useState, useEffect } from 'react';
import { StoreSettings, Coupon, settingsService, couponService } from '../../lib/settings';
import Modal from '../../components/Modal';
import { useDialog } from '../../context/DialogContext';

const AdminSettings: React.FC = () => {
    const { success, error, confirm } = useDialog();
    const [settings, setSettings] = useState<StoreSettings | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'coupons'>('general');
    const [couponModal, setCouponModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form states
    const [settingsForm, setSettingsForm] = useState<Partial<StoreSettings>>({});
    const [couponForm, setCouponForm] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_order_value: '',
        max_uses: '',
        valid_until: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsData, couponsData] = await Promise.all([
                settingsService.get(),
                couponService.getAll(),
            ]);
            setSettings(settingsData);
            setCoupons(couponsData);
            if (settingsData) {
                setSettingsForm(settingsData);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await settingsService.update(settingsForm);
            setSettings({ ...settings, ...settingsForm } as StoreSettings);
            await success('Configurações salvas com sucesso!');
        } catch (err) {
            console.error('Error saving settings:', err);
            await error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenCouponModal = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setCouponForm({
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value.toString(),
                min_order_value: coupon.min_order_value?.toString() || '',
                max_uses: coupon.max_uses?.toString() || '',
                valid_until: coupon.valid_until?.split('T')[0] || '',
                is_active: coupon.is_active,
            });
        } else {
            setEditingCoupon(null);
            setCouponForm({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_order_value: '',
                max_uses: '',
                valid_until: '',
                is_active: true,
            });
        }
        setCouponModal(true);
    };

    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const couponData = {
                code: couponForm.code,
                discount_type: couponForm.discount_type,
                discount_value: parseFloat(couponForm.discount_value),
                min_order_value: couponForm.min_order_value ? parseFloat(couponForm.min_order_value) : undefined,
                max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : undefined,
                valid_until: couponForm.valid_until ? new Date(couponForm.valid_until).toISOString() : undefined,
                is_active: couponForm.is_active,
            };

            if (editingCoupon) {
                await couponService.update(editingCoupon.id, couponData);
            } else {
                await couponService.create(couponData);
            }

            await loadData();
            setCouponModal(false);
        } catch (err) {
            console.error('Error saving coupon:', err);
            await error('Erro ao salvar cupom');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCoupon = async (coupon: Coupon) => {
        const ok = await confirm(`Excluir cupom "${coupon.code}"?`, 'Excluir Cupom');
        if (!ok) return;
        try {
            await couponService.delete(coupon.id);
            await loadData();
        } catch (err) {
            console.error('Error deleting coupon:', err);
            await error('Erro ao excluir cupom');
        }
    };

    const handleToggleCoupon = async (coupon: Coupon) => {
        try {
            await couponService.update(coupon.id, { is_active: !coupon.is_active });
            await loadData();
        } catch (error) {
            console.error('Error toggling coupon:', error);
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
            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === 'general'
                            ? 'text-primary border-primary'
                            : 'text-gray-500 border-transparent hover:text-white'
                    }`}
                >
                    Configurações Gerais
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === 'coupons'
                            ? 'text-primary border-primary'
                            : 'text-gray-500 border-transparent hover:text-white'
                    }`}
                >
                    Cupons de Desconto
                </button>
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
                <div className="glass-panel p-8 space-y-8">
                    {/* Store Info */}
                    <div>
                        <h3 className="text-sm font-display font-bold tracking-widest mb-6">INFORMAÇÕES DA LOJA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Nome da Loja
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.store_name || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={settingsForm.store_email || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_email: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={settingsForm.store_phone || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_phone: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="554896231041"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    value={settingsForm.store_whatsapp || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_whatsapp: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="554896231041"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="text-sm font-display font-bold tracking-widest mb-6">ENDEREÇO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.store_address || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_address: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.store_city || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_city: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Estado
                                </label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={settingsForm.store_state || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, store_state: e.target.value.toUpperCase() })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors uppercase"
                                    placeholder="SC"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-sm font-display font-bold tracking-widest mb-6">REDES SOCIAIS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Instagram
                                </label>
                                <input
                                    type="url"
                                    value={settingsForm.instagram_url || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Facebook
                                </label>
                                <input
                                    type="url"
                                    value={settingsForm.facebook_url || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, facebook_url: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery */}
                    <div>
                        <h3 className="text-sm font-display font-bold tracking-widest mb-6">ENTREGA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Taxa de Entrega
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settingsForm.delivery_fee || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                    Frete Grátis Acima de
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={settingsForm.free_delivery_min || ''}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_min: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div className="flex flex-col justify-end gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.enable_delivery ?? true}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, enable_delivery: e.target.checked })}
                                        className="w-5 h-5 bg-background-dark border border-white/10"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Oferecer entrega
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.enable_pickup ?? true}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, enable_pickup: e.target.checked })}
                                        className="w-5 h-5 bg-background-dark border border-white/10"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Oferecer retirada
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="gold-gradient text-background-dark px-8 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </div>
            )}

            {/* Coupons */}
            {activeTab === 'coupons' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">{coupons.length} cupons cadastrados</p>
                        <button
                            onClick={() => handleOpenCouponModal()}
                            className="gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:brightness-110 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Novo Cupom
                        </button>
                    </div>

                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Código</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Desconto</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Usos</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Validade</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary">Status</th>
                                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-primary text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-6">
                                            <span className="text-sm font-mono font-bold">{coupon.code}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}%`
                                                    : `R$ ${coupon.discount_value.toFixed(2).replace('.', ',')}`}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm">{coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm text-gray-400">
                                                {coupon.valid_until
                                                    ? new Date(coupon.valid_until).toLocaleDateString('pt-BR')
                                                    : 'Sem limite'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                                coupon.is_active
                                                    ? 'bg-emerald-500/20 text-emerald-500'
                                                    : 'bg-gray-500/20 text-gray-500'
                                            }`}>
                                                {coupon.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleCoupon(coupon)}
                                                    className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all"
                                                    title={coupon.is_active ? 'Desativar' : 'Ativar'}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {coupon.is_active ? 'toggle_on' : 'toggle_off'}
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenCouponModal(coupon)}
                                                    className="p-2 hover:bg-white/5 text-gray-400 hover:text-primary transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCoupon(coupon)}
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

                        {coupons.length === 0 && (
                            <div className="text-center py-20">
                                <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">sell</span>
                                <p className="text-gray-500">Nenhum cupom cadastrado</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Coupon Modal */}
            <Modal
                isOpen={couponModal}
                onClose={() => setCouponModal(false)}
                title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            >
                <form onSubmit={handleSaveCoupon} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Código *
                            </label>
                            <input
                                type="text"
                                required
                                value={couponForm.code}
                                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors font-mono uppercase"
                                placeholder="DESCONTO10"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Tipo de Desconto
                            </label>
                            <select
                                value={couponForm.discount_type}
                                onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as any })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            >
                                <option value="percentage">Porcentagem (%)</option>
                                <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Valor do Desconto *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={couponForm.discount_value}
                                onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Pedido Mínimo
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={couponForm.min_order_value}
                                onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Limite de Usos
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={couponForm.max_uses}
                                onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                                placeholder="Ilimitado"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Válido Até
                            </label>
                            <input
                                type="date"
                                value={couponForm.valid_until}
                                onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={couponForm.is_active}
                                onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                                className="w-5 h-5 bg-background-dark border border-white/10"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Cupom Ativo
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setCouponModal(false)}
                            className="flex-1 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 gold-gradient text-background-dark px-6 py-3 font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar Cupom'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminSettings;
