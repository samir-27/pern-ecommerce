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
    <div className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 space-y-6 ${isMobile ? 'shadow-2xl' : ''}`}>
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal size={14} /> Refine Catalog
        </span>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
          {isMobile && onCloseMobile && (
            <button onClick={onCloseMobile} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Department / Gender */}
      <details className="shop-filter-group" open>
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-zinc-900 dark:text-white py-1">
          <span>Department</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="space-y-1.5 mt-2">
          <button
            onClick={() => onUpdateParam('gender', '')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !genderParam
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Departments
          </button>
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => onUpdateParam('gender', g === genderParam ? '' : g)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                genderParam === g
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </details>

      {/* Category */}
      <details className="shop-filter-group" open={Boolean(categoryParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-zinc-900 dark:text-white py-1">
          <span>Garment Category</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="space-y-1.5 mt-2 max-h-56 overflow-y-auto">
          <button
            onClick={() => onUpdateParam('category', '')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !categoryParam
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onUpdateParam('category', c === categoryParam ? '' : c)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                categoryParam === c
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </details>

      {/* Price Range */}
      <details className="shop-filter-group" open={Boolean(priceRangeParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-zinc-900 dark:text-white py-1">
          <span>Price Bracket</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="space-y-1.5 mt-2">
          {priceRanges.map((pr) => (
            <button
              key={pr.value}
              onClick={() => onUpdateParam('priceRange', pr.value === priceRangeParam ? '' : pr.value)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                priceRangeParam === pr.value
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </details>

      {/* Sizes */}
      <details className="shop-filter-group" open={Boolean(sizeParam)}>
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-zinc-900 dark:text-white py-1">
          <span>Size</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => onUpdateParam('size', s === sizeParam ? '' : s)}
              className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                sizeParam === s
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-md'
                  : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
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
