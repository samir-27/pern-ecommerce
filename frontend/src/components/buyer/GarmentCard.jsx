import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const GarmentCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const price = parseFloat(product.base_price || product.price || 0);
  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const discountPercent = comparePrice && comparePrice > price 
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : null;

  const fallbackImage = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const displayImage = product.main_image || (product.images && product.images[0]) || product.image_url || fallbackImage;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select first variant if defined
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    addToCart(product, variant, 1);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div 
      className="group relative flex flex-col bg-[#FBFBFA] border border-[#E8E8E4] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3:4 Vertical Fashion Canvas */}
      <Link 
        to={`/product/${product.id}`} 
        className="relative aspect-[3/4] overflow-hidden bg-[#F4F4F2] block"
      >
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Minimal Corner Tags */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.brand_name && (
            <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-fashion bg-[#FBFBFA]/95 text-[#121212] border border-[#E8E8E4]">
              {product.brand_name}
            </span>
          )}
          {discountPercent && (
            <span className="px-1.5 py-0.5 text-[9px] font-tabular tracking-wider uppercase bg-[#843828] text-white">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Architectural Quick Add Bar (Slides up on desktop hover) */}
        <div 
          className={`absolute inset-x-2 bottom-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={added}
            className={`w-full py-2.5 px-3 text-[10px] font-medium tracking-fashion uppercase flex items-center justify-center gap-1.5 transition-colors ${
              added 
                ? 'bg-[#121212] text-white' 
                : 'bg-[#121212]/95 hover:bg-[#121212] text-white shadow-sm'
            }`}
          >
            {added ? (
              <>
                <Check size={12} className="text-[#E8E8E4]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={12} strokeWidth={1.5} />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Garment Editorial Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2 border-t border-[#E8E8E4]">
        <div>
          {/* Atelier & Department Header */}
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mb-1">
            <span className="truncate">{product.brand_name || 'Atelier'}</span>
            <span className="text-[#A1A1AA]">{product.gender || 'Collection'}</span>
          </div>

          {/* Garment Name */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-ui text-[13px] text-[#121212] line-clamp-1 leading-snug group-hover:text-[#843828] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing Line */}
        <div className="pt-2 border-t border-[#E8E8E4]/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-tabular text-[13px] font-semibold text-[#121212]">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="font-tabular text-[11px] text-[#A1A1AA] line-through">
                ₹{comparePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.id}`}
            className="text-[10px] font-medium uppercase tracking-fashion text-[#71717A] hover:text-[#121212] transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GarmentCard;
