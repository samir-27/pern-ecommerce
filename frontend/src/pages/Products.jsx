import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import {
    getProducts,
    getCategories,
    getColors,
} from "../services/ProductService";
import ProductCard from '../components/ProductCard';
import { useSearchParams } from 'react-router-dom';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const selectedCategory = searchParams.get('category') || 'All';
    const selectedGender = searchParams.get('gender') || 'All';
    const selectedColor = searchParams.get('color') || 'All';
    const selectedSize = searchParams.get('size') || 'All';
    const searchQuery = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    // Close mobile filter when filters change (optional UX polish)
    useEffect(() => {
        setIsMobileFilterOpen(false);
    }, [selectedCategory, selectedGender, selectedColor, selectedSize, searchQuery]);

    // Prevent body scroll when mobile filter is open
    useEffect(() => {
        if (isMobileFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileFilterOpen]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const catData = await getCategories();
                setCategories(catData);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        const fetchColors = async () => {
            try {
                const colorData = await getColors();
                setColors(colorData);
            } catch (err) {
                console.error("Failed to load colors", err);
            }
        };
        fetchColors();
    }, []);

    useEffect(() => {
        const fetchProdData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page,
                    limit: 6,
                    ...(selectedCategory !== 'All' && { category: selectedCategory }),
                    ...(selectedGender !== 'All' && { gender: selectedGender }),
                    ...(selectedColor !== 'All' && { color: selectedColor }),
                    ...(selectedSize !== 'All' && { size: selectedSize }),
                    ...(searchQuery && { search: searchQuery })
                };

                const data = await getProducts(params);

                setProducts(data.products || []);
                setPagination(data.pagination || { currentPage: 1, totalPages: 1 });

            } catch (err) {
                console.error(err);
                setError("Failed to load products.");
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchProdData();
        }, 300);

        return () => clearTimeout(delayDebounceFn);

    }, [selectedCategory, selectedGender, selectedColor, searchQuery, selectedSize, page]);

    const updateURLParams = (key, value, resetPage = true) => {
        const newParams = new URLSearchParams(searchParams);

        if (value && value !== 'All') {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }

        if (resetPage) {
            newParams.set('page', '1');
        }

        setSearchParams(newParams);
    };

    const handleCategoryChange = (cat) => updateURLParams('category', cat);
    const handleGenderChange = (gen) => updateURLParams('gender', gen);
    const handleSearchChange = (query) => updateURLParams('search', query);
    const handleColorChange = (color) => updateURLParams('color', color);
    const handleSizeChange = (size) => updateURLParams('size', size);
    const handlePageChange = (newPage) => updateURLParams('page', newPage, false);

    const hasActiveFilters =
        selectedCategory !== 'All' ||
        selectedGender !== 'All' ||
        selectedColor !== 'All' ||
        selectedSize !== 'All' ||
        searchQuery !== '';

    return (
        <div className="bg-dominant min-h-[90vh] pb-16 sm:pb-24">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">

                {/* Mobile header: Filter button + active filters indicator */}
                <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
                    <button
                        onClick={() => setIsMobileFilterOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-dominant rounded-lg font-semibold text-sm shadow-sm active:scale-95 transition-transform"
                    >
                        <Filter size={18} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-accent" />
                        )}
                    </button>

                    {!loading && !error && (
                        <p className="text-sm text-secondary/70 font-medium">
                            {products.length} product{products.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">

                    {/* ===== Desktop Sidebar ===== */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-6">
                            <Sidebar
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                                selectedGender={selectedGender}
                                selectedSize={selectedSize}
                                onSizeChange={handleSizeChange}
                                colors={colors}
                                selectedColor={selectedColor}
                                onColorChange={handleColorChange}
                                onGenderChange={handleGenderChange}
                                searchQuery={searchQuery}
                                onSearchChange={handleSearchChange}
                            />
                        </div>
                    </aside>

                    {/* ===== Mobile Filter Drawer ===== */}
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
                            isMobileFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={() => setIsMobileFilterOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div
                        className={`fixed inset-y-0 left-0 z-50 w-[min(100%,320px)] bg-dominant shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
                            isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    >
                        <div className="flex flex-col h-full">
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-4 py-4 border-b border-secondary/10">
                                <h2 className="text-lg font-bold text-secondary">Filters</h2>
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="p-2 -mr-2 rounded-full hover:bg-secondary/10 transition-colors"
                                    aria-label="Close filters"
                                >
                                    <X size={22} className="text-secondary" />
                                </button>
                            </div>

                            {/* Scrollable sidebar content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                                <Sidebar
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={handleCategoryChange}
                                    selectedGender={selectedGender}
                                    selectedSize={selectedSize}
                                    onSizeChange={handleSizeChange}
                                    colors={colors}
                                    selectedColor={selectedColor}
                                    onColorChange={handleColorChange}
                                    onGenderChange={handleGenderChange}
                                    searchQuery={searchQuery}
                                    onSearchChange={handleSearchChange}
                                />
                            </div>

                            {/* Drawer footer */}
                            <div className="p-4 border-t border-secondary/10 bg-dominant">
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="w-full py-3 bg-secondary text-dominant rounded-lg font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
                                >
                                    Show results
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===== Products Grid ===== */}
                    <main className="col-span-1 lg:col-span-3 min-w-0">
                        {loading && (
                            <div className="w-full flex justify-center py-16 sm:py-24">
                                <div className="w-10 h-10 border-4 border-secondary/20 border-t-accent rounded-full animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-16 sm:py-24 px-4">
                                <p className="text-lg sm:text-xl text-red-500 font-bold">{error}</p>
                            </div>
                        )}

                        {!loading && !error && products.length === 0 && (
                            <div className="text-center py-12 sm:py-20 px-4 border-2 border-dashed border-secondary/20 rounded-xl">
                                <p className="text-base sm:text-xl text-secondary/60 font-medium">
                                    No products found matching your criteria.
                                </p>
                                <button
                                    onClick={() => setSearchParams(new URLSearchParams())}
                                    className="mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 bg-secondary text-dominant rounded-md hover:bg-accent transition-colors font-semibold shadow-md text-sm sm:text-base"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                         {!loading && !error && products.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                                    {products.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                        />
                                    ))}
                                </div>
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center items-center space-x-4 border-t border-secondary/10 pt-8">
                                        <button 
                                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                            className={`px-4 py-2 rounded font-semibold transition-colors ${page === 1 ? 'text-secondary/30 cursor-not-allowed' : 'text-secondary bg-secondary/5 hover:bg-secondary/10'}`}
                                        >
                                            Previous
                                        </button>
                                        
                                        <span className="text-secondary/70 font-medium">
                                            Page <span className="font-bold text-secondary">{pagination.currentPage}</span> of {pagination.totalPages}
                                        </span>

                                        <button 
                                            onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                            disabled={page === pagination.totalPages}
                                            className={`px-4 py-2 rounded font-semibold transition-colors ${page === pagination.totalPages ? 'text-secondary/30 cursor-not-allowed' : 'text-secondary bg-secondary/5 hover:bg-secondary/10'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;