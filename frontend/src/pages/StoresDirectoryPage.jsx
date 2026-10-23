import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/Axios';

const StoresDirectoryPage = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await api.get('/seller/public/all');
                setStores(res.data || []);
            } catch (err) {
                console.error('Error fetching stores:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] py-8 pb-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Marketplace Creators</p>
                <h1 className="text-3xl md:text-4xl font-black text-secondary mt-1">Independent Designer Stores</h1>
                <p className="text-secondary/60 mt-2 text-sm">
                    Discover handpicked apparel brands, ateliers, and independent fashion studios.
                </p>
            </div>

            {stores.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-secondary/15 rounded-2xl text-secondary/60">
                    <p className="font-semibold">No active stores available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {stores.map(store => (
                        <Link
                            key={store.id}
                            to={`/stores/${store.slug}`}
                            className="group p-6 rounded-3xl border border-secondary/10 bg-dominant hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/15 flex items-center justify-center font-black text-2xl text-secondary overflow-hidden flex-shrink-0">
                                        {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : <Store size={28} className="text-secondary/40" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-secondary text-lg group-hover:text-accent transition-colors">{store.name}</h3>
                                            <ShieldCheck size={16} className="text-green-600" />
                                        </div>
                                        <p className="text-xs text-secondary/60">{store.product_count} listing{store.product_count === 1 ? '' : 's'}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-secondary/70 line-clamp-3 leading-relaxed">{store.bio || 'Independent fashion designer offering curated modern essentials.'}</p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-secondary/10 flex items-center justify-between text-xs font-bold text-accent">
                                <span>Visit Storefront</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoresDirectoryPage;
