import { ShoppingBag, Check, Minus, Plus, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const ProductVariantSelector = ({
  price = 0,
  comparePrice,
  currentStock = 0,
  availableSizes = [],
  selectedSize,
  onSelectSize,
  availableColors = [],
  selectedColor,
  onSelectColor,
  quantity = 1,
  onQuantityChange,
  onAddToCart,
  addedNotice = false
}) => {
  return (
    <div className="space-y-6 font-ui text-[#121212]">
      {/* Price & Stock Line */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 py-3 border-y border-[#E8E8E4]">
        <div className="flex items-baseline gap-3">
          <span className="font-tabular text-2xl sm:text-3xl font-semibold text-[#121212]">
            {formatCurrency(price)}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="font-tabular text-sm text-[#A1A1AA] line-through">
              {formatCurrency(comparePrice)}
            </span>
          )}
        </div>

        <div>
          {currentStock > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-fashion text-[#121212] bg-[#F4F4F2] border border-[#E8E8E4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#121212]" />
              {currentStock <= 5 ? `Only ${currentStock} Left in Atelier` : 'In Stock · Ready to Dispatch'}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] uppercase tracking-fashion text-[#843828] bg-[#843828]/10 border border-[#843828]/20">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-fashion">
            <span className="text-[#121212]">Select Size</span>
            <span className="text-[#71717A] hover:text-[#121212] underline underline-offset-4 cursor-pointer">
              Sizing Matrix
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSelectSize(s)}
                className={`min-w-11 h-10 px-3 text-[11px] font-tabular tracking-wider uppercase border transition-colors cursor-pointer ${
                  selectedSize === s
                    ? 'bg-[#121212] text-white border-[#121212] font-semibold'
                    : 'bg-white border-[#E8E8E4] text-[#121212] hover:border-[#121212]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#121212] block">
            Colorway: <span className="text-[#71717A] font-normal normal-case">{selectedColor || 'Default Palette'}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSelectColor(c)}
                className={`px-3.5 py-1.5 text-xs border transition-colors cursor-pointer ${
                  selectedColor === c
                    ? 'bg-[#121212] text-white border-[#121212] font-medium'
                    : 'bg-white border-[#E8E8E4] text-[#121212] hover:border-[#121212]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart CTA */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-[#E8E8E4] bg-white h-12">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-3.5 h-full hover:bg-[#F4F4F2] text-[#121212] transition-colors cursor-pointer"
            >
              <Minus size={12} />
            </button>
            <span className="px-3 text-xs font-tabular font-medium text-[#121212] min-w-8 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              className="px-3.5 h-full hover:bg-[#F4F4F2] text-[#121212] transition-colors cursor-pointer"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Large Architectural Action Button */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={currentStock <= 0}
            className={`flex-1 h-12 px-6 text-[11px] font-medium uppercase tracking-fashion flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              addedNotice
                ? 'bg-[#121212] text-white'
                : 'bg-[#121212] hover:bg-[#843828] text-white'
            }`}
          >
            {addedNotice ? (
              <>
                <Check size={14} className="text-[#E8E8E4]" />
                <span>Added to Shopping Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} strokeWidth={1.5} />
                <span>Add to Shopping Bag</span>
              </>
            )}
          </button>
        </div>

        {/* Value Trust Footnotes */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E8E8E4] text-[10px] text-[#71717A] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Truck size={13} strokeWidth={1.5} className="text-[#121212]" />
            <span>Priority Cargo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} strokeWidth={1.5} className="text-[#121212]" />
            <span>Vetted Atelier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCcw size={13} strokeWidth={1.5} className="text-[#121212]" />
            <span>7-Day Return</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantSelector;
