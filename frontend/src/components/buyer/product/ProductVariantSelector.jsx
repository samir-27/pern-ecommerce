import { ShoppingBag, Check, Minus, Plus, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Price and Stock status */}
      <div className="flex items-baseline gap-4 py-2 border-y border-zinc-100 dark:border-zinc-800">
        <span className="text-3xl font-black text-zinc-900 dark:text-white">
          {formatCurrency(price)}
        </span>
        {comparePrice && comparePrice > price && (
          <span className="text-base text-zinc-400 line-through">
            {formatCurrency(comparePrice)}
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

      {/* Size Selection */}
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
                onClick={() => onSelectSize(s)}
                className={`min-w-12 h-11 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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

      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white block">
            Color Palette: <span className="text-zinc-500 font-normal">{selectedColor || 'Default'}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => (
              <button
                key={c}
                onClick={() => onSelectColor(c)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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

      {/* Quantity & CTA Button */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-1">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <span className="px-4 text-xs font-bold text-zinc-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={onAddToCart}
            disabled={currentStock <= 0}
            className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
    </div>
  );
};

export default ProductVariantSelector;
