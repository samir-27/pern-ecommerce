import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import {
    getProducts,
    getCategories,
} from "../services/ProductService";
import ProductCard from '../components/ProductCard';
import { useSearchParams } from 'react-router-dom';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Hook into React Router's URL params
    const [searchParams, setSearchParams] = useSearchParams();

    // 2. Read current state directly from URL
    const selectedCategory = searchParams.get('category') || 'All';
    const selectedGender = searchParams.get('gender') || 'All';
    const searchQuery = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;

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
        const fetchProdData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page,
                    limit: 6, // Hardcoded for this preview
                    ...(selectedCategory !== 'All' && { category: selectedCategory }),
                    ...(selectedGender !== 'All' && { gender: selectedGender }),
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

    }, [selectedCategory, selectedGender, searchQuery, page]);

    // 3. Helper to update URL params
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
    const handlePageChange = (newPage) => updateURLParams('page', newPage, false);

    return (
        <div className="bg-dominant min-h-[90vh] pt-12 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary mb-2">Our Collection</h1>
                    <p className="text-secondary/60">
                        {searchParams.toString() ? 'Viewing filtered results.' : 'Discover the latest minimalist essentials.'}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    <Sidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                        selectedGender={selectedGender}
                        onGenderChange={handleGenderChange}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                    />

                    <main className="flex-1">
                        {loading && (
                            <div className="w-full flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-secondary/20 border-t-accent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-20">
                                <p className="text-xl text-red-500 font-bold">{error}</p>
                            </div>
                        )}

                        {!loading && !error && products.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-secondary/20 rounded-xl">
                                <p className="text-xl text-secondary/60 font-medium">No products found matching your criteria.</p>
                                <button
                                    onClick={() => setSearchParams(new URLSearchParams())}
                                    className="mt-6 px-6 py-2 bg-secondary text-dominant rounded-md hover:bg-accent transition-colors font-semibold shadow-md"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {!loading && !error && products.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center items-center space-x-4 border-t border-secondary/10 pt-8 mt-12">
                                        <button 
                                            onClick={() => handlePageChange(Math.max(page - 1, 1))}
                                            disabled={page === 1}
                                            className={`px-4 py-2 rounded font-semibold transition-colors ${page === 1 ? 'text-secondary/30 cursor-not-allowed' : 'text-secondary bg-secondary/5 hover:bg-secondary/10'}`}
                                        >
                                            Previous
                                        </button>
                                        
                                        <span className="text-secondary/70 font-medium">
                                            Page <span className="font-bold text-secondary">{pagination.currentPage}</span> of {pagination.totalPages}
                                        </span>

                                        <button 
                                            onClick={() => handlePageChange(Math.min(page + 1, pagination.totalPages))}
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