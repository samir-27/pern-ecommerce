import { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductReviewsSection = ({
  reviews = [],
  currentUser,
  onSubmitReview,
  reviewSubmitting = false
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fabric');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const hasAlreadyReviewed = currentUser?.id && reviews.some(r => Number(r.user_id) === Number(currentUser.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please sign in to share an editorial review.');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const success = await onSubmitReview({ rating: reviewRating, comment: reviewComment.trim() });
    if (success) {
      setReviewComment('');
      setReviewRating(5);
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('fabric')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'fabric'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Fabric & Care
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'shipping'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Shipping & Returns
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Client Reviews ({reviews.length})
        </button>
      </div>

      <div className="py-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {activeTab === 'fabric' && (
          <div className="space-y-2">
            <p>• Premium textile blend selected for drape, breathability, and wrinkle recovery.</p>
            <p>• Hand wash cold or dry clean recommended to preserve fiber integrity.</p>
            <p>• Warm iron under protective cotton cloth if needed.</p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-2">
            <p>• Complimented express shipping on all orders over ₹1,999.</p>
            <p>• Delivered within 2-4 business days across metropolitan areas.</p>
            <p>• 7-day hassle-free doorstep returns and exchanges in original garment tags.</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {hasAlreadyReviewed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <strong className="block text-zinc-900 dark:text-white font-bold">Review Already Submitted</strong>
                  <span>You have already shared your impressions for this garment. Only one review per client is permitted.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white block">
                  Leave an Editorial Review
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Rating:</span>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star size={16} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="Share your fit feedback, fabric feel, and styling impressions..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-zinc-400 italic">No reviews yet. Be the first to share your impressions!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white">{r.username || r.user_name || 'Verified Client'}</span>
                      <div className="flex text-amber-400">
                        {[...Array(r.rating || 5)].map((_, idx) => (
                          <Star key={idx} size={12} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-500">{r.content || r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviewsSection;
