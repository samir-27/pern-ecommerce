import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import { Store, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/Axios';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [recRes, storesRes] = await Promise.all([
          api.get('/ai/recommendations').catch(() => ({ data: { recommendations: [] } })),
          api.get('/seller/public/all').catch(() => ({ data: [] }))
        ]);
        setRecommendations(recRes.data?.recommendations || []);
        setFeaturedStores(storesRes.data?.slice(0, 3) || []);
      } catch (err) {
        console.error('Home data error:', err);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      <Hero />

      {/* Marketplace Value Proposition */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 flex items-start gap-4">
          <div className="p-3 bg-accent/15 rounded-xl text-accent"><Store size={24} /></div>
          <div>
            <h3 className="font-bold text-secondary text-lg">Independent Creators</h3>
            <p className="text-sm text-secondary/70 mt-1">Direct from verified fashion boutiques and independent atelier studios.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 flex items-start gap-4">
          <div className="p-3 bg-green-500/15 rounded-xl text-green-600"><ShieldCheck size={24} /></div>
          <div>
            <h3 className="font-bold text-secondary text-lg">Verified Authenticity</h3>
            <p className="text-sm text-secondary/70 mt-1">Every seller is vetted, verified, and backed by buyer protection & safe payouts.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-secondary/5 p-6 flex items-start gap-4">
          <div className="p-3 bg-purple-500/15 rounded-xl text-purple-600"><Sparkles size={24} /></div>
          <div>
            <h3 className="font-bold text-secondary text-lg">AI Fashion Stylist</h3>
            <p className="text-sm text-secondary/70 mt-1">Natural language conversational shopping assistant to match your exact aesthetic.</p>
          </div>
        </div>
      </section>

      {/* Featured Designer Stores */}
      {featuredStores.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-secondary/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Marketplace Brands</p>
              <h2 className="text-2xl font-black text-secondary mt-1">Featured Designer Stores</h2>
            </div>
            <Link to="/stores" className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
              View all stores <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredStores.map(store => (
              <Link 
                to={`/stores/${store.slug}`} 
                key={store.id}
                className="group rounded-2xl border border-secondary/10 bg-dominant p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center font-black text-xl text-secondary overflow-hidden">
                    {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : store.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-lg group-hover:text-accent transition-colors">{store.name}</h3>
                    <p className="text-xs text-secondary/60">{store.product_count} listing{store.product_count === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <p className="text-sm text-secondary/70 line-clamp-2">{store.bio || 'Independent fashion designer offering curated modern essentials.'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Products */}
      {recommendations.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-secondary/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Curated For You</p>
              <h2 className="text-2xl font-black text-secondary mt-1">Recommended Styles</h2>
            </div>
            <Link to="/products" className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
              Explore catalog <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
