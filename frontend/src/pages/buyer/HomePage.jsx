import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronRight, Flame } from 'lucide-react';
import api from '@/services/Axios';
import GarmentCard from '@/components/buyer/GarmentCard';

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
    <div className="home-page space-y-16 pb-20">
      {/* 1. Hero Editorial Section */}
      <section className="home-hero mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div className="home-hero__copy">
          <div className="home-hero__eyebrow">
            <Sparkles size={14} />
            <span>The considered wardrobe · Spring / Summer '26</span>
          </div>
          <h1>
            Good clothes.
            <br />
            <em>Great stories.</em>
          </h1>
          <p>
            Discover thoughtfully made pieces from independent designers who care about the details as much as you do.
          </p>
          <div className="home-hero__actions">
            <Link to="/products" className="home-hero__primary">
              <span>Explore the collection</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/brands" className="home-hero__secondary">Meet the makers</Link>
          </div>
          <div className="home-hero__proof">
            <div><strong>01</strong><span>Independent labels</span></div>
            <div><strong>02</strong><span>Thoughtful design</span></div>
            <div><strong>03</strong><span>Made to be worn</span></div>
          </div>
        </div>
        <div className="home-hero__visual">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
            alt="A considered edit of contemporary fashion"
          />
          <div className="home-hero__image-note">
            <span>THE NEW SEASON</span>
            <strong>Wear it your way.</strong>
          </div>
          <div className="home-hero__stamp" aria-hidden="true">GOOD<br />THINGS<br />TAKE TIME</div>
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
                to={`/brands/${brand.slug || brand.id}`}
                className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center hover:border-zinc-400 transition-all shadow-sm"
              >
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-3 border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={brand.logo_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=120&q=80'}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                  {brand.name}
                </h3>
                <span className="text-[10px] text-zinc-400 block mt-0.5 uppercase tracking-wider">
                  Verified Atelier
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Curated Garments Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1">
              <Flame size={12} /> Seasonal Capsule
            </span>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Latest Editorial Garments
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="rounded-2xl bg-zinc-200 dark:bg-zinc-800 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredGarments.map((garment) => (
              <GarmentCard key={garment.id} product={garment} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Editorial Department Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-zinc-900 text-white p-8 md:p-14 border border-zinc-800 shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
              Modern Craftsmanship
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Direct from Independent Design Studios
            </h2>
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
              Every garment on PERN Atelier is sourced directly from verified clothing labels. No mass production. No compromises.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/products?gender=Mens"
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                Men's Department
              </Link>
              <Link
                to="/products?gender=Womens"
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
              >
                Women's Department
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 md:opacity-40 hidden sm:block pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80"
              alt="Tailoring"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
