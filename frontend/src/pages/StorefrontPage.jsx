import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../services/Axios';
import ProductCard from '../components/ProductCard';

const StorefrontPage = () => {
    const { slug } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStore = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/seller/public/${slug}`);
                setStore(res.data.store);
                setProducts(res.data.products || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Store not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <p className="text-red-500 font-bold mb-4">{error || 'Storefront not found'}</p>
                <Link to="/stores" className="text-sm font-bold text-accent hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Browse all marketplace stores
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] pb-16">
            {/* Store Banner */}
            <div className="h-48 md:h-64 rounded-3xl bg-secondary/15 border border-secondary/10 overflow-hidden relative mb-8">
                {store.banner_url ? (
                    <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-secondary/10 to-accent/20 flex items-center justify-center">
                        <Store size={48} className="text-secondary/30" />
                    </div>
                )}
            </div>

            {/* Store Header Info */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8 border-b border-secondary/10 mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-dominant border-2 border-secondary/20 shadow-md flex items-center justify-center font-black text-2xl text-secondary overflow-hidden flex-shrink-0">
                        {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : store.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-secondary">{store.name}</h1>
                            <ShieldCheck size={20} className="text-green-600" title="Verified Independent Creator" />
                        </div>
                        <p className="text-sm text-secondary/70 mt-1 max-w-xl">{store.bio || 'Independent fashion boutique and designer on MINIMAL.'}</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-xs uppercase font-bold text-secondary/50">Marketplace Creator</p>
                    <p className="text-lg font-black text-secondary">{products.length} Products Live</p>
                </div>
            </div>

            {/* Store Catalog */}
            <div>
                <h2 className="text-xl font-bold text-secondary mb-6">Store Collection</h2>
                {products.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-secondary/15 rounded-2xl text-secondary/60">
                        <p className="font-semibold">No products currently active in this store.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorefrontPage;
