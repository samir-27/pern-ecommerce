import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import Sidebar from "../components/Sidebar";
import {
    getProducts,
    getCategories,
} from "../services/ProductService";
import ProductCard from '../components/ProductCard';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedGender, setSelectedGender] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [categories, products] = await Promise.all([
                    getCategories(),
                    getProducts(),
                ]);

                setCategories(categories);
                setProducts(products);

                console.log("Fetched categories:", categories);
            } catch (err) {
                console.error(err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category_name === selectedCategory;
        const matchesGender = selectedGender === 'All' || product.gender === selectedGender;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesGender && matchesSearch;
    });

    return (
        <div className="bg-dominant min-h-screen pt-12 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-12">
                    <h1 className="text-4xl font-black text-secondary mb-2">Our Collection</h1>
                    <p className="text-secondary/60">Discover the latest minimalist essentials.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">

                    <Sidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        selectedGender={selectedGender}
                        onGenderChange={setSelectedGender}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
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
                                <p className="text-secondary/60 mt-2">Check your terminal running the Express server.</p>
                            </div>
                        )}

                        {!loading && !error && filteredProducts.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-xl text-secondary/60">No products found matching your criteria.</p>
                                <button
                                    onClick={() => { setSelectedCategory('All'); setSelectedGender('All'); setSearchQuery(''); }}
                                    className="mt-4 text-accent hover:underline font-semibold"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {!loading && !error && filteredProducts.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;