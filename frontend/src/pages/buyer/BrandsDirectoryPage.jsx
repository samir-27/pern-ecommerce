import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import api from '@/services/Axios';

const BrandsDirectoryPage = () => {
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/brand/public/all').catch(() => api.get('/brand/directory'));
        setBrands(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load brands directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12">
        
        {/* Editorial Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] border-b border-[#843828]/30 pb-1">
            <span>Independent Atelier Directory</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-light text-[#121212] leading-tight">
            The Makers & Design Houses
          </h1>
          <p className="text-xs sm:text-[13px] text-[#71717A] max-w-xl leading-relaxed">
            Every clothing label represented on MINIMAL undergoes strict atelier vetting to guarantee tailoring standards, textile integrity, and ethical dispatch.
          </p>

          {/* Minimal Search Bar */}
          <div className="pt-2 max-w-md relative">
            <input
              type="text"
              placeholder="Search by atelier name or aesthetic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-[#E8E8E4] focus:border-[#121212] text-[#121212] placeholder-[#A1A1AA] focus:outline-none transition-colors rounded-none"
            />
            <Search size={14} className="absolute left-3 top-3 text-[#71717A]" />
          </div>
        </div>

        {/* Brand Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-[#EFEFEA] animate-pulse border border-[#E8E8E4]" />
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E8E4] p-8 space-y-3">
            <h3 className="font-editorial text-2xl font-light text-[#121212]">No Ateliers Matching Search</h3>
            <p className="text-xs text-[#71717A]">Try clearing your search query to view all vetted fashion houses.</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-5 py-2 bg-[#121212] text-white text-[10px] font-medium uppercase tracking-fashion"
              >
                Reset Search
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((b) => (
              <Link
                key={b.id}
                to={`/brands/${b.slug || b.id}`}
                className="group flex flex-col bg-white border border-[#E8E8E4] hover:border-[#121212] transition-colors"
              >
                {/* Brand Cover Banner */}
                <div className="h-36 bg-[#F4F4F2] relative overflow-hidden border-b border-[#E8E8E4]">
                  <img
                    src={b.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-medium uppercase tracking-fashion bg-[#FBFBFA]/95 text-[#121212] border border-[#E8E8E4] flex items-center gap-1">
                    <ShieldCheck size={10} className="text-[#843828]" />
                    <span>Verified Atelier</span>
                  </div>
                </div>

                {/* Brand Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4 -mt-8 relative z-10">
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 bg-white border border-[#E8E8E4] overflow-hidden flex items-center justify-center font-editorial text-xl text-[#121212] shrink-0">
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        b.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="pt-2">
                      <h3 className="font-editorial text-lg font-normal text-[#121212] group-hover:text-[#843828] transition-colors">
                        {b.name}
                      </h3>
                      <p className="text-xs text-[#71717A] line-clamp-2 mt-0.5 leading-relaxed">
                        {b.description || 'Verified independent designer label curated for MINIMAL Atelier.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8E8E4] flex items-center justify-between text-[11px] font-medium uppercase tracking-fashion text-[#121212] group-hover:text-[#843828]">
                    <span>Explore Atelier Collection</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BrandsDirectoryPage;
