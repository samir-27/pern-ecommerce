import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Heart, Sparkles, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

const GarmentCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const price = parseFloat(product.base_price || product.price || 0);
  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const discountPercent = comparePrice && comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : null;

  const fallbackImage = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80';
  const displayImage = product.image_url || (product.images && product.images[0]) || fallbackImage;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Choose first available variant if exists
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    addToCart(product, variant, 1);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div 
      className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Garment Image Stage */}
      <Link to={`/product/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 block">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Brand Tag Pill */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
          {product.brand_name && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 backdrop-blur-md rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
              {product.brand_name}
            </span>
          )}
          {discountPercent && (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600 text-white rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className={`absolute inset-x-3 bottom-3 flex items-center gap-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <button
            onClick={handleQuickAdd}
            disabled={added}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all ${
              added 
                ? 'bg-emerald-600 text-white' 
                : 'bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-white backdrop-blur-sm'
            }`}
          >
            {added ? (
              <>
                <Check size={14} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Quick Add
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Product Details Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Category & Gender Pill */}
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            <span>{product.gender || 'Unisex'}</span>
            <span>•</span>
            <span>{product.category || 'Apparel'}</span>
          </div>

          {/* Garment Title */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Sizes Tagline if available */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold">Sizes:</span>
              <span>{Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}</span>
            </div>
          )}
        </div>

        {/* Pricing Line */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-xs text-zinc-400 line-through">
                ₹{comparePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.id}`}
            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <span>View</span>
            <Eye size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GarmentCard;
