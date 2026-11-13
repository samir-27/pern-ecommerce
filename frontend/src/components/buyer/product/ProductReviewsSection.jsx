import { useState } from 'react';
import { Star, Check } from 'lucide-react';
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
      alert('Please sign in to share an atelier review.');
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
    <div className="border-t border-[#E8E8E4] pt-8 font-ui text-[#121212]">
      {/* Editorial Navigation Tabs */}
      <div className="flex border-b border-[#E8E8E4] gap-8 text-[11px] font-semibold uppercase tracking-fashion">
        <button
          type="button"
          onClick={() => setActiveTab('fabric')}
          className={`pb-3 border-b transition-colors cursor-pointer ${
            activeTab === 'fabric'
              ? 'border-[#121212] text-[#121212]'
              : 'border-transparent text-[#71717A] hover:text-[#121212]'
          }`}
        >
          Fabric & Care
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`pb-3 border-b transition-colors cursor-pointer ${
            activeTab === 'shipping'
              ? 'border-[#121212] text-[#121212]'
              : 'border-transparent text-[#71717A] hover:text-[#121212]'
          }`}
        >
          Shipping & Logistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 border-b transition-colors cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-[#121212] text-[#121212]'
              : 'border-transparent text-[#71717A] hover:text-[#121212]'
          }`}
        >
          Client Impressions ({reviews.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="py-5 text-xs text-[#71717A] leading-relaxed">
        {activeTab === 'fabric' && (
          <div className="space-y-2 max-w-lg">
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>Premium natural textile blend selected for drape, breathability, and structural retention.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>Professional dry clean recommended, or delicate hand wash cold in pH-neutral solvent.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>Steam or press under cotton pressing cloth at moderate heat setting.</span>
            </p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-2 max-w-lg">
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>Complimentary insured air dispatch on all domestic orders across India.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>Standard delivery within 2–4 business days via verified courier logistics partners.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#121212] font-semibold">●</span>
              <span>7-day doorstep return and size exchange for unworn garments with original atelier tags attached.</span>
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {hasAlreadyReviewed ? (
              <div className="p-3.5 bg-[#F4F4F2] border border-[#E8E8E4] text-xs flex items-center gap-2.5">
                <Check size={16} className="text-[#843828] shrink-0" />
                <span className="text-[#121212]">
                  Your review has been recorded. To preserve editorial integrity, each client is limited to one review per garment.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 bg-[#FBFBFA] border border-[#E8E8E4] space-y-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#121212] block">
                  Write a Client Impression
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#71717A]">Rating:</span>
                  <div className="flex gap-1 text-[#843828]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Star size={14} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Describe garment drape, tailoring precision, and fabric feel..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] text-xs focus:outline-none transition-colors rounded-none placeholder-[#A1A1AA]"
                />

                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="px-5 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors cursor-pointer disabled:opacity-40"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Post Impression'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-xs text-[#A1A1AA] italic">No client impressions recorded yet for this piece.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="p-3.5 bg-white border border-[#E8E8E4] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#121212]">
                        {r.username || r.user_name || 'Verified Client'}
                      </span>
                      <div className="flex text-[#843828]">
                        {[...Array(r.rating || 5)].map((_, idx) => (
                          <Star key={idx} size={11} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#71717A] leading-relaxed pt-0.5">{r.content || r.comment}</p>
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
