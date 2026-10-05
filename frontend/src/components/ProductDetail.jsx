import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShoppingBag,
    ShieldCheck,
    Truck,
    Package,
    Star,
} from 'lucide-react';
import { createProductReview, getProductById, getProductReviews } from '../services/ProductService';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../services/Currency';

const getDeduplicatedImages = (productData, color) => Array.from(
    new Set(
        productData.variants
            .filter((variant) => variant.color === color)
            .flatMap((variant) => variant.image_urls || [])
    )
);

const ProductDetailsPage = () => {
    const { addToCart } = useCart();
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeImage, setActiveImage] = useState('');
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const [data, productReviews] = await Promise.all([
                    getProductById(id),
                    getProductReviews(id),
                ]);
                setProduct(data);
                setReviews(productReviews);

                if (data.variants && data.variants.length > 0) {
                    const initialVariant = data.variants[0];
                    setSelectedColor(initialVariant.color);
                    setSelectedSize(initialVariant.size);

                    const initialImages = getDeduplicatedImages(data, initialVariant.color);
                    if (initialImages.length > 0) setActiveImage(initialImages[0]);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleColorChange = (color) => {
        setSelectedColor(color);
        const newColorImages = getDeduplicatedImages(product, color);
        if (newColorImages.length > 0) setActiveImage(newColorImages[0]);

        const availableSizes = product.variants
            .filter((v) => v.color === color)
            .map((v) => v.size);
        if (!availableSizes.includes(selectedSize)) {
            setSelectedSize(availableSizes[0]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-dominant">
                <div className="w-9 h-9 border-3 border-secondary/20 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-dominant px-4">
                <p className="text-base text-red-500 font-semibold mb-4">
                    {error || 'Product not found'}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-secondary/70 hover:text-secondary flex items-center gap-1.5"
                >
                    <ArrowLeft size={16} /> Go back
                </button>
            </div>
        );
    }

    const uniqueColors = [...new Set(product.variants.map((v) => v.color))];
    const sizesForSelectedColor = product.variants.filter(
        (v) => v.color === selectedColor
    );
    const activeVariant =
        product.variants.find(
            (v) => v.color === selectedColor && v.size === selectedSize
        ) || product.variants[0];
    const currentPrice = activeVariant?.price_override || product.base_price;
    const isOutOfStock = activeVariant?.stock_quantity <= 0;
    const currentImages = getDeduplicatedImages(product, selectedColor);
        console.log('Current images for selected color:', currentImages);

    const handleAddToCart = () => {

        const variantForCart = {
            ...activeVariant,
            image_urls: [activeImage] 
        };
        
        addToCart(variantForCart, product, 1);
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        setReviewError('');

        if (!reviewContent.trim()) {
            setReviewError('Please write a review before submitting.');
            return;
        }

        try {
            setIsSubmittingReview(true);
            const newReview = await createProductReview(id, {
                rating: reviewRating,
                content: reviewContent,
            });
            setReviews((currentReviews) => [newReview, ...currentReviews]);
            setReviewContent('');
            setReviewRating(5);
        } catch (err) {
            setReviewError(err.response?.data?.error || 'Unable to submit your review.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const averageRating = reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
        : 0;

    const renderStars = (rating, size = 16) => (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={star <= rating ? 'fill-accent text-accent' : 'text-secondary/20'}
                />
            ))}
        </div>
    );

    return (
        <div className="bg-dominant min-h-screen pb-16 sm:pb-20">
            <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 pt-4 sm:pt-6">

                {/* Back button — compact */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 mb-5 sm:mb-6 text-sm text-secondary/55 hover:text-secondary transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-12">

                    {/* ========== LEFT: Image Gallery ========== */}
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Main image — fixed aspect, handles any image size */}
                        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-secondary/5 rounded-xl overflow-hidden">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center"
                                    // object-cover + absolute inset ensures any ratio fills the box cleanly
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-secondary/30 text-sm">
                                    No image
                                </div>
                            )}
                        </div>

                        {/* Thumbnails — horizontal scroll on mobile, wraps nicely */}
                        {currentImages.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                {currentImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(img)}
                                        className={`relative shrink-0 w-14 h-16 sm:w-16 sm:h-[4.5rem] rounded-lg overflow-hidden border-2 transition-colors ${
                                            activeImage === img
                                                ? 'border-accent'
                                                : 'border-transparent hover:border-secondary/25'
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${i + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover object-center"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ========== RIGHT: Details ========== */}
                    <div className="flex flex-col lg:pt-1">
                        {/* Title & price */}
                        <h1 className="text-xl sm:text-2xl lg:text-[1.65rem] font-bold text-secondary leading-snug tracking-tight">
                            {product.name}
                        </h1>

                        <p className="mt-2 text-lg sm:text-xl font-semibold text-secondary">
                            {formatCurrency(currentPrice)}
                        </p>

                        {/* Description */}
                        {product.description && (
                            <p className="mt-3 sm:mt-4 text-sm text-secondary/65 leading-relaxed max-w-prose">
                                {product.description}
                            </p>
                        )}

                        {/* Color selector */}
                        <div className="mt-6 sm:mt-7">
                            <p className="text-xs font-semibold uppercase tracking-wide text-secondary/50 mb-2">
                                Color — <span className="text-secondary/80 normal-case tracking-normal">{selectedColor}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {uniqueColors.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleColorChange(c)}
                                        className={`px-3.5 py-1.5 text-sm rounded-md border transition-colors ${
                                            selectedColor === c
                                                ? 'border-accent bg-accent/10 text-secondary font-medium'
                                                : 'border-secondary/15 text-secondary/70 hover:border-secondary/35'
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size selector */}
                        <div className="mt-5 sm:mt-6">
                            <p className="text-xs font-semibold uppercase tracking-wide text-secondary/50 mb-2">
                                Size
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {sizesForSelectedColor.map((v) => (
                                    <button
                                        key={v.size}
                                        onClick={() => setSelectedSize(v.size)}
                                        disabled={v.stock_quantity <= 0}
                                        className={`min-w-[2.75rem] px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            selectedSize === v.size
                                                ? 'bg-secondary text-dominant border-secondary font-medium'
                                                : v.stock_quantity <= 0
                                                ? 'border-secondary/10 text-secondary/30 cursor-not-allowed line-through'
                                                : 'border-secondary/15 text-secondary/70 hover:border-secondary/35'
                                        }`}
                                    >
                                        {v.size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stock hint */}
                        {activeVariant && !isOutOfStock && activeVariant.stock_quantity <= 5 && (
                            <p className="mt-3 text-xs text-amber-600 font-medium">
                                Only {activeVariant.stock_quantity} left
                            </p>
                        )}

                        {/* Add to cart */}
                        <button
                            disabled={isOutOfStock}
                            className={`mt-6 sm:mt-8 w-full sm:w-auto sm:min-w-[220px] inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-semibold transition-all ${
                                isOutOfStock
                                    ? 'bg-secondary/15 text-secondary/40 cursor-not-allowed'
                                    : 'bg-secondary text-dominant hover:bg-accent active:scale-[0.98]'
                            }`}
                            onClick={handleAddToCart}
                        >
                            <ShoppingBag size={16} />
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        {/* Trust badges — compact */}
                        <div className="mt-8 sm:mt-10 pt-6 border-t border-secondary/10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="flex items-center gap-2.5 text-secondary/55">
                                <Truck size={16} className="shrink-0" />
                                <span className="text-xs">Free shipping over ₹150</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-secondary/55">
                                <ShieldCheck size={16} className="shrink-0" />
                                <span className="text-xs">Secure checkout</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-secondary/55">
                                <Package size={16} className="shrink-0" />
                                <span className="text-xs">Easy returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mt-12 sm:mt-16 border-t border-secondary/10 pt-8 sm:pt-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-secondary/50">Customer reviews</p>
                            <div className="mt-2 flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-secondary">
                                    {reviews.length ? averageRating.toFixed(1) : 'No ratings'}
                                </h2>
                                {reviews.length > 0 && renderStars(Math.round(averageRating), 18)}
                                <span className="text-sm text-secondary/55">
                                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-7 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] gap-8 lg:gap-12">
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <p className="text-sm text-secondary/55">Be the first to review this product.</p>
                            ) : (
                                reviews.map((review) => (
                                    <article key={review.id} className="border-b border-secondary/10 pb-6 last:border-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                {renderStars(Number(review.rating), 15)}
                                                <span className="text-sm font-semibold text-secondary">{review.username}</span>
                                            </div>
                                            <time className="text-xs text-secondary/45" dateTime={review.created_at}>
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </time>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-secondary/70">{review.content}</p>
                                    </article>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleReviewSubmit} className="rounded-xl border border-secondary/10 bg-secondary/5 p-5 sm:p-6">
                            <h3 className="text-base font-semibold text-secondary">Write a review</h3>
                            <p className="mt-1 text-xs text-secondary/55">Share your experience with this product.</p>

                            <div className="mt-5">
                                <span className="block text-xs font-semibold uppercase tracking-wide text-secondary/50">Your rating</span>
                                <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="rounded p-1 text-accent transition-transform hover:scale-110"
                                            aria-label={`${star} star${star === 1 ? '' : 's'}`}
                                            aria-pressed={reviewRating === star}
                                        >
                                            <Star size={21} className={star <= reviewRating ? 'fill-accent' : 'text-secondary/20'} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-secondary/50" htmlFor="review-content">
                                Your review
                            </label>
                            <textarea
                                id="review-content"
                                value={reviewContent}
                                onChange={(event) => setReviewContent(event.target.value)}
                                maxLength={2000}
                                rows={5}
                                placeholder="What did you think?"
                                className="mt-2 w-full resize-y rounded-lg border border-secondary/15 bg-dominant px-3 py-2.5 text-sm text-secondary outline-none placeholder:text-secondary/35 focus:border-accent"
                            />
                            <div className="mt-1 text-right text-xs text-secondary/40">{reviewContent.length}/2000</div>

                            {reviewError && <p className="mt-3 text-sm text-red-500">{reviewError}</p>}

                            <button
                                type="submit"
                                disabled={isSubmittingReview}
                                className="mt-4 w-full rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-dominant transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmittingReview ? 'Submitting...' : 'Submit review'}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProductDetailsPage;