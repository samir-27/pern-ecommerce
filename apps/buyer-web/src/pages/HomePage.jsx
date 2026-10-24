import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Store, Flame } from 'lucide-react';
import api from '@api';
import GarmentCard from '../components/GarmentCard';

const HomePage = () => {
  const [featuredGarments, setFeaturedGarments] = useState([]);
  const [partnerBrands, setPartnerBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [prodRes, brandsRes] = await Promise.all([
          api.get('/products?limit=8').catch(() => ({ data: { products: [] } })),
          api.get('/brand/public/all').catch(() => ({ data: [] }))
        ]);

        const products = prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
        setFeaturedGarments(products);
        setPartnerBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. Hero Editorial Section */}
      <section className="relative overflow-hidden bg-zinc-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80"
            alt="Editorial runway collection"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-1"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 lg:py-28 flex flex-col justify-between">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest uppercase text-amber-300">
              <Sparkles size={14} />
              <span>Spring / Summer '26 Runway</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none uppercase">
              Contemporary <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Atelier Fashion
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-lg">
              Curated clothing collections directly from verified independent fashion houses and boutique designers. Master tailoring, breathable luxury fabrics, and architectural cuts.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-xl shadow-white/10"
              >
                <span>Shop New Arrivals</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/products?gender=Mens"
                className="px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
              >
                Explore Men
              </Link>
              <Link
                to="/products?gender=Womens"
                className="px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
              >
                Explore Women
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl text-xs">
            <div>
              <span className="block text-2xl font-black text-white">100%</span>
              <span className="text-zinc-400 font-medium">Verified Brand Partners</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-white">48h</span>
              <span className="text-zinc-400 font-medium">Express Courier Dispatch</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-white">7 Days</span>
              <span className="text-zinc-400 font-medium">Doorstep Returns Guarantee</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-amber-300">24/7</span>
              <span className="text-zinc-400 font-medium">Dedicated Customer Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Partner Brands Spotlight */}
      {partnerBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 block mb-1">
                Official Ateliers
              </span>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                Featured Clothing Brands
              </h2>
            </div>
            <Link
              to="/brands"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Brands</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partnerBrands.slice(0, 6).map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.slug}`}
                className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-lg transition-all text-center flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg text-zinc-800 dark:text-zinc-200 group-hover:scale-105 transition-transform overflow-hidden">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    brand.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {brand.name}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                    {brand.origin || 'Verified Brand'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Curated Fashion Capsules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/products?gender=Mens"
            className="group relative h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=700&q=80"
              alt="Men's Tailoring"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block mb-1">Couture Edit</span>
              <h3 className="text-xl font-black uppercase">Tailored Men's Outerwear</h3>
              <p className="text-xs text-zinc-300 mt-1">Blazers, trench coats & fine knitwear.</p>
            </div>
          </Link>

          <Link
            to="/products?gender=Womens"
            className="group relative h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80"
              alt="Women's Runway"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block mb-1">Spring Capsule</span>
              <h3 className="text-xl font-black uppercase">Modern Womenswear</h3>
              <p className="text-xs text-zinc-300 mt-1">Silhouettes, silk blouses & slip dresses.</p>
            </div>
          </Link>

          <Link
            to="/products?category=Suits%20%26%20Blazers"
            className="group relative h-96 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <img
              src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=700&q=80"
              alt="Tailored Suits and Blazers"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block mb-1">Bespoke Atelier</span>
              <h3 className="text-xl font-black uppercase">Tailored Suits & Blazers</h3>
              <p className="text-xs text-zinc-300 mt-1">Structured silhouettes, fine wool, & double-breasted cuts.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Trending Garments Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame size={15} />
              <span>In High Demand</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Trending Apparel Drops
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Garments</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : featuredGarments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Catalog is Updating</h3>
            <p className="text-xs text-zinc-500 mt-1">New designer collections are currently being onboarded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {featuredGarments.map((product) => (
              <GarmentCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Brand Seller Onboarding Invitation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block">
              For Clothing Brands & Designers
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Showcase Your Brand to Discerning Buyers
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Join MINIMAL Atelier as an official brand partner. Benefit from our dedicated Brand Studio dashboard, inventory dispatch hub, real-time analytics, and transparent 10% platform commission.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-colors shadow-lg shadow-amber-500/20 text-center"
            >
              Register Your Brand
            </Link>
            <Link
              to="/seller"
              className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-center"
            >
              Brand Seller Portal
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
