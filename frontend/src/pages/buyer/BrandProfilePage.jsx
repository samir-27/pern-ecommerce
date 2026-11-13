import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@/services/Axios';
import GarmentCard from '@/components/buyer/GarmentCard';

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
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-24">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-[#121212] border-t-transparent animate-spin mx-auto" />
          <p className="text-[11px] uppercase tracking-fashion text-[#71717A]">
            Opening Atelier Portfolio...
          </p>
        </div>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center py-24 font-ui">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <h2 className="font-editorial text-3xl font-light text-[#121212]">Atelier Not Found</h2>
          <p className="text-xs text-[#71717A] leading-relaxed">
            The atelier requested is currently unavailable or undergoes annual curation.
          </p>
          <div className="pt-2">
            <Link 
              to="/brands" 
              className="px-6 py-3 bg-[#121212] text-white text-[11px] font-medium uppercase tracking-fashion inline-block"
            >
              Back to Atelier Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        
        {/* Brand Hero Stage */}
        <div className="relative border border-[#E8E8E4] bg-[#121212] overflow-hidden">
          {/* Banner Image */}
          <div className="h-60 sm:h-80 w-full relative">
            <img
              src={brandData.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'}
              alt={brandData.name}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {/* Brand Details Overlay */}
          <div className="relative z-10 px-6 sm:px-10 pb-8 -mt-16 flex flex-col sm:flex-row items-start sm:items-end gap-6 justify-between text-white">
            <div className="flex items-end gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border border-[#E8E8E4] overflow-hidden shadow-xl flex items-center justify-center font-editorial text-3xl text-[#121212] shrink-0">
                {brandData.logo_url ? (
                  <img src={brandData.logo_url} alt={brandData.name} className="w-full h-full object-cover" />
                ) : (
                  brandData.name?.charAt(0).toUpperCase()
                )}
              </div>

              <div className="pb-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-editorial text-2xl sm:text-4xl font-light tracking-tight">{brandData.name}</h1>
                  <span className="p-1 text-white" title="Verified Atelier">
                    <ShieldCheck size={16} className="text-[#843828]" />
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] max-w-xl leading-relaxed">
                  {brandData.description || 'Independent brand partner crafting bespoke fashion collections.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 pb-1">
              <Link
                to="/brands"
                className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-fashion bg-white/10 hover:bg-white text-white hover:text-[#121212] border border-white/30 transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft size={12} />
                <span>All Ateliers</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Brand Catalog Section */}
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#E8E8E4] pb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block mb-1">
                Atelier Catalog
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#121212]">
                Pieces by {brandData.name}
              </h2>
            </div>
            <span className="text-[11px] font-tabular uppercase tracking-fashion text-[#71717A]">
              {products.length} Garments
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E8E8E4] p-8 space-y-2">
              <h3 className="font-editorial text-2xl font-light text-[#121212]">No Garments Available</h3>
              <p className="text-xs text-[#71717A]">This atelier is currently curating its seasonal capsule release.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <GarmentCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrandProfilePage;
