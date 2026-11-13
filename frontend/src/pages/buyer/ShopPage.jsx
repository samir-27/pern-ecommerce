import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        
        {/* Architectural Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E8E8E4]">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] mb-1">
              Garment Directory
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-light text-[#121212]">
              {categoryParam ? categoryParam : genderParam ? `${genderParam}'s Atelier Edit` : 'The Curated Catalog'}
            </h1>
            <p className="text-[12px] text-[#71717A] mt-1 font-tabular">
              Showing {filteredProducts.length} unique pieces from independent fashion houses
            </p>
          </div>

          {/* Sort & Mobile Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 text-[11px] font-medium uppercase tracking-fashion border border-[#121212] bg-[#FBFBFA] cursor-pointer"
            >
              <SlidersHorizontal size={12} />
              <span>Filter ({[categoryParam, genderParam, priceRangeParam, sizeParam].filter(Boolean).length})</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] uppercase tracking-fashion text-[#71717A] hidden sm:inline">Sort By:</span>
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-3 py-2 text-xs bg-[#FBFBFA] border border-[#E8E8E4] focus:border-[#121212] text-[#121212] focus:outline-none cursor-pointer rounded-none"
              >
                <option value="newest">Newest Releases</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Garment Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Strip */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-fashion text-[#71717A] mr-1">
              Active Filters:
            </span>
            {genderParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white border border-[#E8E8E4] text-[#121212]">
                <span>Dept: {genderParam}</span>
                <button type="button" onClick={() => updateParam('gender', '')} className="text-[#71717A] hover:text-[#121212]">
                  <X size={10} />
                </button>
              </span>
            )}
            {categoryParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white border border-[#E8E8E4] text-[#121212]">
                <span>Category: {categoryParam}</span>
                <button type="button" onClick={() => updateParam('category', '')} className="text-[#71717A] hover:text-[#121212]">
                  <X size={10} />
                </button>
              </span>
            )}
            {priceRangeParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white border border-[#E8E8E4] text-[#121212]">
                <span>Price: {priceRanges.find(p => p.value === priceRangeParam)?.label || priceRangeParam}</span>
                <button type="button" onClick={() => updateParam('priceRange', '')} className="text-[#71717A] hover:text-[#121212]">
                  <X size={10} />
                </button>
              </span>
            )}
            {sizeParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white border border-[#E8E8E4] text-[#121212]">
                <span>Size: {sizeParam}</span>
                <button type="button" onClick={() => updateParam('size', '')} className="text-[#71717A] hover:text-[#121212]">
                  <X size={10} />
                </button>
              </span>
            )}
            {searchParam && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white border border-[#E8E8E4] text-[#121212]">
                <span>Query: "{searchParam}"</span>
                <button type="button" onClick={() => updateParam('search', '')} className="text-[#71717A] hover:text-[#121212]">
                  <X size={10} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[10px] uppercase tracking-fashion text-[#843828] underline underline-offset-4 ml-2 hover:opacity-80"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Main Grid: Sidebar + Product Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
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
            </div>
          </aside>

          {/* Mobile Filter Drawer Overlay */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden flex justify-end">
              <div className="w-full max-w-xs h-full bg-[#FBFBFA] overflow-y-auto">
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

          {/* Product Cards Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-[#EFEFEA] aspect-[3/4] animate-pulse border border-[#E8E8E4]" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 sm:p-16 text-center border border-[#E8E8E4] bg-white space-y-4">
                <span className="font-editorial text-3xl font-light text-[#121212] block">
                  No Garments Found
                </span>
                <p className="text-xs text-[#71717A] max-w-sm mx-auto leading-relaxed">
                  We could not find any pieces matching your current filters. Try selecting different attributes or resetting filters.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-[#121212] text-white text-[11px] font-medium uppercase tracking-fashion hover:bg-[#843828] transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((garment) => (
                  <GarmentCard key={garment.id} product={garment} />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default ShopPage;
