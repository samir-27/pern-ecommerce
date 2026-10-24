import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Star, 
  Check, 
  Sparkles, 
  Minus, 
  Plus, 
  ArrowLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import api from '@api';
import { useCart } from '../context/CartContext';
import GarmentCard from '../components/GarmentCard';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('fabric'); // 'fabric' | 'shipping' | 'reviews'
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [prodRes, reviewsRes, relatedRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews`).catch(() => ({ data: [] })),
          api.get(`/products?limit=4`).catch(() => ({ data: { products: [] } }))
        ]);

        const prod = prodRes.data;
        setProduct(prod);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

        const related = (relatedRes.data?.products || relatedRes.data || []).filter(p => p.id !== prod.id);
        setRelatedProducts(related.slice(0, 4));

        // Auto-select first variant
        if (prod.variants && prod.variants.length > 0) {
          const first = prod.variants[0];
          setSelectedVariant(first);
          setSelectedSize(first.size || '');
          setSelectedColor(first.color || '');
        } else if (prod.sizes && prod.sizes.length > 0) {
          setSelectedSize(Array.isArray(prod.sizes) ? prod.sizes[0] : prod.sizes);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    if (product.variants && product.variants.length > 0) {
      const match = product.variants.find(v => v.size === size && (!selectedColor || v.color === selectedColor))
        || product.variants.find(v => v.size === size);
      if (match) {
        setSelectedVariant(match);
        if (match.color) setSelectedColor(match.color);
      }
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (product.variants && product.variants.length > 0) {
      const match = product.variants.find(v => v.color === color && (!selectedSize || v.size === selectedSize))
        || product.variants.find(v => v.color === color);
      if (match) {
        setSelectedVariant(match);
        if (match.size) setSelectedSize(match.size);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedVariant || { size: selectedSize, color: selectedColor }, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      alert(err.response?.data?.message || 'Please log in to submit a review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 max-w-xl mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-3xl mb-6"></div>
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 mx-auto rounded-lg"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Garment Not Found</h2>
        <p className="text-zinc-500 text-xs mt-2">The product you are looking for may have been archived.</p>
        <Link to="/products" className="mt-6 inline-block px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase">
          Back to Catalog
        </Link>
      </div>
    );
  }

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariant?.id, selectedColor]);

  const variantImages = (selectedVariant?.image_urls && selectedVariant.image_urls.length > 0)
    ? selectedVariant.image_urls
    : null;

  const images = variantImages
    || (product.images && product.images.length > 0 ? product.images : null)
    || [product.main_image || product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];

  const price = selectedVariant?.price_override 
    ? parseFloat(selectedVariant.price_override) 
    : parseFloat(product.base_price || product.price || 0);

  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const currentStock = selectedVariant?.stock_quantity ?? product.stock_quantity ?? 10;

  // Extract unique available sizes & colors from variants or fallback
  const availableSizes = product.variants && product.variants.length > 0
    ? [...new Set(product.variants.map(v => v.size).filter(Boolean))]
    : (Array.isArray(product.sizes) ? product.sizes : ['Standard']);

  const availableColors = product.variants && product.variants.length > 0
    ? [...new Set(product.variants.map(v => v.color).filter(Boolean))]
    : (Array.isArray(product.colors) ? product.colors : []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <Link to="/" className="hover:text-zinc-900 dark:hover:text-white">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-zinc-900 dark:hover:text-white">Shop</Link>
        <ChevronRight size={12} />
        <span className="text-zinc-900 dark:text-white font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 relative group shadow-sm">
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover object-top"
            />
            {product.brand_name && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 shadow-md backdrop-blur-md">
                {product.brand_name}
              </span>
            )}
          </div>

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx 
                      ? 'border-blue-600 ring-2 ring-blue-500/20' 
                      : 'border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Garment Details & Actions */}
        <div className="space-y-6">
          
          {/* Brand & Department */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {product.brand_name || 'MINIMAL Atelier'}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {product.gender || 'Unisex'} / {product.category || 'Clothing'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing & Stock Status */}
          <div className="flex items-baseline gap-4 py-2 border-y border-zinc-100 dark:border-zinc-800">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-base text-zinc-400 line-through">
                ₹{comparePrice.toLocaleString('en-IN')}
              </span>
            )}
            <div className="ml-auto">
              {currentStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentStock <= 5 ? `Only ${currentStock} Left!` : 'In Stock & Ready to Dispatch'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {product.description || "Expertly crafted from selected textiles with meticulous attention to drape, proportion, and finishing details. Designed for discerning wardrobes."}
          </p>

          {/* Variant Selection: Size */}
          {availableSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-900 dark:text-white uppercase tracking-wider">Select Size</span>
                <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Size Chart</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSizeChange(s)}
                    className={`min-w-12 h-11 px-4 rounded-xl text-xs font-bold transition-all border ${
                      selectedSize === s
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-md'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selection: Color */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white block">
                Color Palette: <span className="text-zinc-500 font-normal">{selectedColor || 'Default'}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedColor === c
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 text-xs font-bold text-zinc-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart Primary Button */}
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addedNotice ? (
                  <>
                    <Check size={16} /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Shopping Bag
                  </>
                )}
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-4 text-[11px] text-zinc-500 font-medium">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-zinc-400" />
                <span>Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-zinc-400" />
                <span>Verified Atelier</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-zinc-400" />
                <span>7-Day Return</span>
              </div>
            </div>
          </div>

          {/* Garment Details & Review Tabs */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('fabric')}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === 'fabric'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Fabric & Care
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === 'shipping'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Shipping & Returns
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 border-b-2 transition-colors ${
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
                  {/* Reviews Form */}
                  <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
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
                            className="p-0.5"
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
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <p className="text-zinc-400 italic">No reviews yet. Be the first to share your impressions!</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-white">{r.user_name || 'Verified Client'}</span>
                            <div className="flex text-amber-400">
                              {[...Array(r.rating || 5)].map((_, idx) => (
                                <Star key={idx} size={12} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="text-zinc-500">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Related Garments Carousel */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Complete the Atelier Look
            </h2>
            <Link to="/products" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Browse All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <GarmentCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetailPage;
