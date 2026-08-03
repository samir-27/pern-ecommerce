import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShoppingBag,
    ShieldCheck,
    Truck,
    Package,
} from 'lucide-react';
import { getProductById } from '../services/ProductService';
import { useCart } from '../context/CartContext';

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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductById(id);
                setProduct(data);

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

    const getDeduplicatedImages = (prod, color) => {
        return Array.from(
            new Set(
                prod.variants
                    .filter((v) => v.color === color)
                    .flatMap((v) => v.image_urls || [])
            )
        );
    };

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
                            ${Number(currentPrice).toFixed(2)}
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
                                <span className="text-xs">Free shipping over $50</span>
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
            </div>
        </div>
    );
};

export default ProductDetailsPage;