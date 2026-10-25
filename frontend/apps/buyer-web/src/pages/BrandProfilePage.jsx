import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@api';
import GarmentCard from '../components/GarmentCard';

const BrandProfilePage = () => {
  const { slug } = useParams();
  const [brandData, setBrandData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/brand/public/${slug}`).catch(() => api.get(`/seller/public/${slug}`));
        setBrandData(res.data?.brand || res.data);
        setProducts(res.data?.products || []);
      } catch (err) {
        console.error('Failed to load brand profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrand();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl mb-6"></div>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Brand Not Found</h2>
        <p className="text-zinc-500 text-xs mt-2">The brand profile you requested is currently unavailable.</p>
        <Link to="/brands" className="mt-6 inline-block px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold uppercase">
          Back to Brands Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Brand Hero Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        {/* Banner */}
        <div className="h-60 sm:h-80 w-full relative">
          <img
            src={brandData.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'}
            alt={brandData.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>

        {/* Brand Details Overlay */}
        <div className="relative z-10 px-6 sm:px-10 pb-8 -mt-20 flex flex-col sm:flex-row items-start sm:items-end gap-6 justify-between text-white">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center font-black text-3xl text-zinc-900 dark:text-white shrink-0">
              {brandData.logo_url ? (
                <img src={brandData.logo_url} alt={brandData.name} className="w-full h-full object-cover" />
              ) : (
                brandData.name?.charAt(0).toUpperCase()
              )}
            </div>

            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">{brandData.name}</h1>
                <span className="p-1 rounded-full bg-emerald-500 text-zinc-950" title="Verified Brand">
                  <ShieldCheck size={16} />
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                {brandData.description || 'Independent brand partner crafting bespoke fashion collections.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pb-2">
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Store
            </Link>
          </div>
        </div>
      </div>

      {/* Brand Catalog Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Garments by {brandData.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {products.length} styles available exclusively from this atelier
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No active products found for this brand.</p>
            <p className="text-xs text-zinc-500 mt-1">Check back soon for new season drop updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <GarmentCard key={p.id} product={{ ...p, brand_name: brandData.name }} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default BrandProfilePage;
