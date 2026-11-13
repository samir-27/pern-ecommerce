import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import api from '@/services/Axios';
import GarmentCard from '@/components/buyer/GarmentCard';
import ShopFilters from '@/components/buyer/ShopFilters';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categoryParam = searchParams.get('category') || '';
  const genderParam = searchParams.get('gender') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const priceRangeParam = searchParams.get('priceRange') || '';
  const sizeParam = searchParams.get('size') || '';

  const defaultClothingCategories = [
    'Shirts & Tops', 
    'T-Shirts & Polos', 
    'Trousers & Pants', 
    'Jeans & Denim', 
    'Suits & Blazers', 
    'Dresses & Gowns', 
    'Jackets & Outerwear', 
    'Sweaters & Knitwear', 
    'Activewear & Loungewear', 
    'Ethnic & Traditional', 
    'Accessories'
  ];

  const [categories, setCategories] = useState(defaultClothingCategories);
  const genders = ['Mens', 'Womens', 'Kids', 'Unisex'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size', '28', '30', '32', '34', '36', '38', '40'];
  const priceRanges = [
    { label: 'Under ₹2,000', value: '0-2000' },
    { label: '₹2,000 - ₹5,000', value: '2000-5000' },
    { label: '₹5,000 - ₹10,000', value: '5000-10000' },
    { label: 'Above ₹10,000', value: '10000-999999' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryObj = {};
        if (categoryParam) queryObj.category = categoryParam;
        if (genderParam) queryObj.gender = genderParam;
        if (searchParam) queryObj.search = searchParam;
        if (sizeParam) queryObj.size = sizeParam;
        if (priceRangeParam) {
          const [min, max] = priceRangeParam.split('-');
          if (min) queryObj.minPrice = min;
          if (max) queryObj.maxPrice = max;
        }
        if (sortParam && sortParam !== 'newest') {
          if (sortParam === 'price_low') queryObj.sort = 'price_asc';
          else if (sortParam === 'price_high') queryObj.sort = 'price_desc';
          else queryObj.sort = sortParam;
        }

        const queryString = new URLSearchParams(queryObj).toString();
        const [prodRes, catRes] = await Promise.all([
          api.get(`/products?${queryString}`).catch(() => ({ data: { products: [] } })),
          api.get('/products/categories').catch(() => ({ data: [] }))
        ]);

        const fetched = prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
        setProducts(fetched);
        if (Array.isArray(catRes.data) && catRes.data.length > 0) {
          setCategories(catRes.data.map(c => c.name));
        }
      } catch (err) {
        console.error('Failed to fetch shop products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryParam, genderParam, searchParam, sizeParam, priceRangeParam, sortParam]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  let filteredProducts = [...products];

  if (priceRangeParam) {
    const [min, max] = priceRangeParam.split('-').map(Number);
    filteredProducts = filteredProducts.filter(p => {
      const price = parseFloat(p.base_price || p.price || 0);
      return price >= min && price <= max;
    });
  }

  if (sizeParam) {
    filteredProducts = filteredProducts.filter(p => {
      if (Array.isArray(p.sizes)) {
        return p.sizes.includes(sizeParam);
      }
      return true;
    });
  }

  if (sortParam === 'price_low') {
    filteredProducts.sort((a, b) => parseFloat(a.base_price || a.price || 0) - parseFloat(b.base_price || b.price || 0));
  } else if (sortParam === 'price_high') {
    filteredProducts.sort((a, b) => parseFloat(b.base_price || b.price || 0) - parseFloat(a.base_price || a.price || 0));
  } else if (sortParam === 'name') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const hasActiveFilters = Boolean(categoryParam || genderParam || searchParam || priceRangeParam || sizeParam);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block mb-1">
            Curated Collections
          </span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Atelier Clothing Catalog
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {filteredProducts.length} unique garments available across verified designer brands
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-semibold hidden sm:inline">Sort:</span>
            <select
              value={sortParam}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Product Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <ShopFilters
            genders={genders}
            genderParam={genderParam}
            categories={categories}
            categoryParam={categoryParam}
            priceRanges={priceRanges}
            priceRangeParam={priceRangeParam}
            sizes={sizes}
            sizeParam={sizeParam}
            onUpdateParam={updateParam}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </aside>

        {/* Mobile Filter Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
            <div className="w-full max-w-xs h-full bg-white dark:bg-zinc-900 p-4 overflow-y-auto">
              <ShopFilters
                genders={genders}
                genderParam={genderParam}
                categories={categories}
                categoryParam={categoryParam}
                priceRanges={priceRanges}
                priceRangeParam={priceRangeParam}
                sizes={sizes}
                sizeParam={sizeParam}
                onUpdateParam={updateParam}
                onClearAll={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
                isMobile={true}
                onCloseMobile={() => setIsMobileFilterOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Product Catalog Stage */}
        <div className="lg:col-span-3">
          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">Active:</span>
              {genderParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  Dept: {genderParam}
                  <button onClick={() => updateParam('gender', '')} className="cursor-pointer"><X size={12} /></button>
                </span>
              )}
              {categoryParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  Category: {categoryParam}
                  <button onClick={() => updateParam('category', '')} className="cursor-pointer"><X size={12} /></button>
                </span>
              )}
              {priceRangeParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  Price Filtered
                  <button onClick={() => updateParam('priceRange', '')} className="cursor-pointer"><X size={12} /></button>
                </span>
              )}
              {sizeParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  Size: {sizeParam}
                  <button onClick={() => updateParam('size', '')} className="cursor-pointer"><X size={12} /></button>
                </span>
              )}
              {searchParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  "{searchParam}"
                  <button onClick={() => updateParam('search', '')} className="cursor-pointer"><X size={12} /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold ml-auto hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Loading or Empty State or Product Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No Garments Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                We couldn't find any clothing items matching your selected criteria. Try adjusting or resetting your filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((product) => (
                <GarmentCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
