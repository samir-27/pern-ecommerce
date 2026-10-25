import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ArrowRight, Search } from 'lucide-react';
import api from '@api';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} /> Official Atelier Partners
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
          Brand Directory
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Discover verified independent clothing brands, bespoke design houses, and master artisans featured on MINIMAL Atelier.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="Search brand by name or aesthetic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-zinc-400" />
        </div>
      </div>

      {/* Brand Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
          <h3 className="font-bold text-zinc-900 dark:text-white">No Brands Matching Search</h3>
          <p className="text-xs text-zinc-500 mt-1">Try another keyword or view all registered brand sellers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrands.map((b) => (
            <Link
              key={b.id}
              to={`/brands/${b.slug}`}
              className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 hover:shadow-xl hover:border-blue-500/40 transition-all duration-300"
            >
              {/* Brand Cover Banner */}
              <div className="h-36 bg-zinc-900 relative overflow-hidden">
                <img
                  src={b.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'}
                  alt={b.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" /> Verified
                </div>
              </div>

              {/* Brand Body */}
              <div className="p-6 flex flex-col flex-1 justify-between gap-4 -mt-10 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-md overflow-hidden flex items-center justify-center font-black text-xl text-zinc-900 dark:text-white shrink-0">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      b.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="pt-4">
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {b.name}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {b.origin || 'Independent Atelier'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {b.description || 'Dedicated to tailored silhouettes, sustainable textile sourcing, and modern sartorial elegance.'}
                </p>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Explore Brand Collection</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};

export default BrandsDirectoryPage;
