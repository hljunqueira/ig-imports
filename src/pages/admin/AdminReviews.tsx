import React, { useState, useEffect } from 'react';
import { reviewsService } from '../../lib/reviews';
import type { ProductReview } from '../../types';

const AdminReviews: React.FC = () => {
    const [reviews, setReviews] = useState<(ProductReview & { product: { name: string; image_url: string } })[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showReplyModal, setShowReplyModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            let approved: boolean | undefined;
            if (filter === 'pending') approved = false;
            if (filter === 'approved' || filter === 'featured') approved = true;

            const featured = filter === 'featured' ? true : undefined;

            const [reviewsData, pendingData] = await Promise.all([
                reviewsService.getReviews({ approved, featured }),
                reviewsService.getPendingReviews(),
            ]);

            setReviews(reviewsData as (ProductReview & { product: { name: string; image_url: string } })[]);
            setPendingCount(pendingData.length);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
        setIsLoading(false);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleApprove = async (id: string) => {
        try {
            await reviewsService.approveReview(id);
            loadData();
        } catch (error) {
            alert('Erro ao aprovar avaliação');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Tem certeza que deseja rejeitar esta avaliação?')) return;

        try {
            await reviewsService.rejectReview(id);
            loadData();
        } catch (error) {
            alert('Erro ao rejeitar avaliação');
        }
    };

    const handleFeature = async (id: string, featured: boolean) => {
        try {
            await reviewsService.featureReview(id, featured);
            loadData();
        } catch (error) {
            alert('Erro ao atualizar destaque');
        }
    };

    const handleReply = async () => {
        if (!selectedReview || !replyText.trim()) return;

        // TODO: Get current user ID from auth
        const adminId = 'current-user-id';

        try {
            await reviewsService.addReply({
                review_id: selectedReview.id,
                reply_text: replyText,
                replied_by: adminId,
            });

            setShowReplyModal(false);
            setSelectedReview(null);
            setReplyText('');
            loadData();
        } catch (error) {
            alert('Erro ao enviar resposta');
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                    >
                        star
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Avaliações de Produtos</h1>
                <p className="text-gray-400">Gerencie feedbacks e avaliações dos clientes</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Total de Avaliações</p>
                    <p className="text-2xl font-bold text-white">{reviews.length}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Aprovadas</p>
                    <p className="text-2xl font-bold text-green-400">
                        {reviews.filter((r) => r.is_approved).length}
                    </p>
                </div>
                <div className="bg-card-dark border border-white/10 p-4 rounded-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Destacadas</p>
                    <p className="text-2xl font-bold text-primary">
                        {reviews.filter((r) => r.is_featured).length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: `Pendentes (${pendingCount})` },
                    { id: 'approved', label: 'Aprovadas' },
                    { id: 'featured', label: 'Destacadas' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as typeof filter)}
                        className={`px-4 py-2 text-xs font-medium rounded-sm transition-colors ${
                            filter === f.id
                                ? 'bg-primary text-background-dark'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">rate_review</span>
                    <p>Nenhuma avaliação encontrada</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-card-dark border border-white/10 rounded-sm p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Product Info */}
                                <div className="flex items-start gap-3 md:w-1/4">
                                    {review.product?.image_url && (
                                        <img
                                            src={review.product.image_url}
                                            alt={review.product.name}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div>
                                        <p className="text-white font-medium text-sm">{review.product?.name}</p>
                                        <p className="text-gray-500 text-xs">{formatDate(review.created_at!)}</p>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {renderStars(review.rating)}
                                        {review.title && <span className="text-white font-medium">{review.title}</span>}
                                    </div>
                                    <p className="text-white text-sm mb-2">{review.comment}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>Por: {review.customer_name}</span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">thumb_up</span>
                                            {review.helpful_count} útil
                                        </span>
                                    </div>

                                    {/* Replies */}
                                    {review.replies && review.replies.length > 0 && (
                                        <div className="mt-4 pl-4 border-l-2 border-primary/30">
                                            {review.replies.map((reply) => (
                                                <div key={reply.id} className="mb-2">
                                                    <p className="text-gray-300 text-sm">{reply.reply_text}</p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        Resposta da loja • {formatDate(reply.created_at!)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 md:w-auto">
                                    {!review.is_approved && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(review.id)}
                                                className="px-3 py-2 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">check</span>
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleReject(review.id)}
                                                className="px-3 py-2 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                                Rejeitar
                                            </button>
                                        </>
                                    )}
                                    {review.is_approved && (
                                        <>
                                            <button
                                                onClick={() => handleFeature(review.id, !review.is_featured)}
                                                className={`px-3 py-2 text-xs rounded flex items-center gap-1 ${
                                                    review.is_featured
                                                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {review.is_featured ? 'star' : 'star_border'}
                                                </span>
                                                {review.is_featured ? 'Destacado' : 'Destacar'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedReview(review);
                                                    setShowReplyModal(true);
                                                }}
                                                className="px-3 py-2 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">reply</span>
                                                Responder
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && selectedReview && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark border border-white/10 rounded-sm max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Responder Avaliação</h3>
                        <div className="mb-4">
                            <p className="text-gray-400 text-sm mb-2">Avaliação:</p>
                            <p className="text-white bg-white/5 p-3 rounded text-sm">{selectedReview.comment}</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Sua Resposta</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-sm px-4 py-2 text-white h-32 resize-none"
                                placeholder="Escreva sua resposta ao cliente..."
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowReplyModal(false);
                                    setSelectedReview(null);
                                    setReplyText('');
                                }}
                                className="flex-1 px-4 py-2 border border-white/10 text-white rounded-sm hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={!replyText.trim()}
                                className="flex-1 px-4 py-2 bg-primary text-background-dark font-bold rounded-sm hover:brightness-110 disabled:opacity-50"
                            >
                                Enviar Resposta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
