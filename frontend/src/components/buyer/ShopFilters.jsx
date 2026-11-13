import { SlidersHorizontal, RotateCcw, ChevronDown, X } from 'lucide-react';

const ShopFilters = ({
  genders = [],
  genderParam = '',
  categories = [],
  categoryParam = '',
  priceRanges = [],
  priceRangeParam = '',
  sizes = [],
  sizeParam = '',
  onUpdateParam,
  onClearAll,
  hasActiveFilters = false,
  isMobile = false,
  onCloseMobile
}) => {
  return (
    <div className={`bg-[#FBFBFA] border border-[#E8E8E4] p-5 space-y-6 font-ui text-[#121212] ${isMobile ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E8E4]">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-fashion text-[#121212]">
          <SlidersHorizontal size={13} strokeWidth={1.5} />
          <span>Refine Selection</span>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] font-medium uppercase tracking-fashion text-[#843828] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Clear All</span>
            </button>
          )}
          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 text-[#71717A] hover:text-[#121212] cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Department / Gender */}
      <details className="group border-b border-[#E8E8E4] pb-4" open>
        <summary className="flex items-center justify-between cursor-pointer text-[11px] font-semibold uppercase tracking-fashion text-[#121212] py-1 list-none">
          <span>Department</span>
          <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-200 text-[#71717A]" />
        </summary>
        <div className="space-y-1 mt-3">
          <button
            type="button"
            onClick={() => onUpdateParam('gender', '')}
            className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
              !genderParam
                ? 'bg-[#121212] text-white font-medium'
                : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
            }`}
          >
            <span>All Departments</span>
            {!genderParam && <span className="text-[10px]">●</span>}
          </button>
          {genders.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onUpdateParam('gender', g === genderParam ? '' : g)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                genderParam === g
                  ? 'bg-[#121212] text-white font-medium'
                  : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
              }`}
            >
              <span>{g}</span>
              {genderParam === g && <span className="text-[10px]">●</span>}
            </button>
          ))}
        </div>
      </details>

      {/* 2. Category */}
      <details className="group border-b border-[#E8E8E4] pb-4" open={Boolean(categoryParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-[11px] font-semibold uppercase tracking-fashion text-[#121212] py-1 list-none">
          <span>Category</span>
          <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-200 text-[#71717A]" />
        </summary>
        <div className="space-y-1 mt-3 max-h-60 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onUpdateParam('category', '')}
            className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
              !categoryParam
                ? 'bg-[#121212] text-white font-medium'
                : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
            }`}
          >
            <span>All Categories</span>
            {!categoryParam && <span className="text-[10px]">●</span>}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onUpdateParam('category', c === categoryParam ? '' : c)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                categoryParam === c
                  ? 'bg-[#121212] text-white font-medium'
                  : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
              }`}
            >
              <span className="truncate">{c}</span>
              {categoryParam === c && <span className="text-[10px]">●</span>}
            </button>
          ))}
        </div>
      </details>

      {/* 3. Price Bracket */}
      <details className="group border-b border-[#E8E8E4] pb-4" open={Boolean(priceRangeParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-[11px] font-semibold uppercase tracking-fashion text-[#121212] py-1 list-none">
          <span>Price Bracket</span>
          <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-200 text-[#71717A]" />
        </summary>
        <div className="space-y-1 mt-3">
          {priceRanges.map((pr) => (
            <button
              key={pr.value}
              type="button"
              onClick={() => onUpdateParam('priceRange', pr.value === priceRangeParam ? '' : pr.value)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between font-tabular ${
                priceRangeParam === pr.value
                  ? 'bg-[#121212] text-white font-medium'
                  : 'text-[#71717A] hover:text-[#121212] hover:bg-[#F4F4F2]'
              }`}
            >
              <span>{pr.label}</span>
              {priceRangeParam === pr.value && <span className="text-[10px]">●</span>}
            </button>
          ))}
        </div>
      </details>

      {/* 4. Sizes Matrix */}
      <details className="group pb-1" open={Boolean(sizeParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-[11px] font-semibold uppercase tracking-fashion text-[#121212] py-1 list-none">
          <span>Size</span>
          <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-200 text-[#71717A]" />
        </summary>
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdateParam('size', s === sizeParam ? '' : s)}
              className={`py-2 text-[11px] font-tabular tracking-wider uppercase transition-colors border cursor-pointer ${
                sizeParam === s
                  ? 'bg-[#121212] text-white border-[#121212] font-semibold'
                  : 'bg-white border-[#E8E8E4] text-[#121212] hover:border-[#121212]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
};

export default ShopFilters;
