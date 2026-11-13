import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FBFBFA] text-[#121212] font-ui space-y-16 lg:space-y-24 pb-24">
      {/* 1. Full-Bleed Architectural Hero Section */}
      <section className="relative border-b border-[#E8E8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-12 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Editorial Copy (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase font-semibold tracking-loose-caps text-[#843828] border-b border-[#843828]/30 pb-1">
                <span>The Contemporary Edit · Autumn / Winter '26</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#121212] leading-[1.05]">
                Tailored silhouttes.
                <br />
                <span className="italic font-normal">Considered craft.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#71717A] max-w-lg leading-relaxed font-normal">
                Discover uncompromised ready-to-wear and bespoke garments crafted by independent ateliers across India and abroad.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/products"
                  className="px-8 py-3.5 bg-[#121212] hover:bg-[#843828] text-white text-[11px] font-medium tracking-fashion uppercase transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight size={13} />
                </Link>

                <Link
                  to="/brands"
                  className="px-6 py-3.5 border border-[#121212] hover:border-[#843828] hover:text-[#843828] text-[#121212] text-[11px] font-medium tracking-fashion uppercase transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Meet the Ateliers</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Editorial Proof Numbers */}
              <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#E8E8E4] max-w-lg">
                <div>
                  <span className="font-tabular text-sm font-semibold text-[#121212] block">01</span>
                  <span className="text-[11px] text-[#71717A] uppercase tracking-wider block mt-0.5">Direct Ateliers</span>
                </div>
                <div>
                  <span className="font-tabular text-sm font-semibold text-[#121212] block">02</span>
                  <span className="text-[11px] text-[#71717A] uppercase tracking-wider block mt-0.5">Strict Vetting</span>
                </div>
                <div>
                  <span className="font-tabular text-sm font-semibold text-[#121212] block">03</span>
                  <span className="text-[11px] text-[#71717A] uppercase tracking-wider block mt-0.5">5% Fair Share</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Imagery (5 columns) */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#F4F4F2] border border-[#E8E8E4]">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
                  alt="A considered edit of contemporary fashion"
                  className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-700"
                />
                
                <div className="absolute bottom-4 left-4 right-4 bg-[#FBFBFA]/95 backdrop-blur-sm border border-[#E8E8E4] p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-loose-caps text-[#71717A] block">Runway Capsule</span>
                    <strong className="text-[12px] font-semibold text-[#121212] font-ui">Winter Trench & Overcoats</strong>
                  </div>
                  <Link
                    to="/products?category=Jackets%20%26%20Outerwear"
                    className="text-[10px] uppercase tracking-fashion font-medium text-[#121212] hover:text-[#843828] underline underline-offset-4"
                  >
                    View Edit →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Official Ateliers Showcase */}
      {partnerBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#E8E8E4]">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block mb-1">
                Verified Partners
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#121212]">
                Independent Fashion Ateliers
              </h2>
            </div>
            <Link
              to="/brands"
              className="text-[11px] font-medium uppercase tracking-fashion text-[#121212] hover:text-[#843828] flex items-center gap-1 transition-colors"
            >
              <span>View Directory</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {partnerBrands.slice(0, 6).map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.slug || brand.id}`}
                className="group p-5 bg-[#FBFBFA] border border-[#E8E8E4] text-center hover:border-[#121212] transition-all"
              >
                <div className="w-14 h-14 mx-auto overflow-hidden bg-[#F4F4F2] mb-3.5 border border-[#E8E8E4]">
                  <img
                    src={brand.logo_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=120&q=80'}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-ui text-xs font-semibold text-[#121212] truncate">
                  {brand.name}
                </h3>
                <span className="text-[10px] text-[#71717A] uppercase tracking-fashion block mt-1">
                  Verified Atelier
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Trending Curated Garments Grid (Dynamic Data via GarmentCard) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#E8E8E4]">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block mb-1">
              Curated Selection
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#121212]">
              Latest Atelier Releases
            </h2>
          </div>
          <Link
            to="/products"
            className="text-[11px] font-medium uppercase tracking-fashion text-[#121212] hover:text-[#843828] flex items-center gap-1 transition-colors"
          >
            <span>Explore All Garments</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-[#EFEFEA] aspect-[3/4] animate-pulse border border-[#E8E8E4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGarments.map((garment) => (
              <GarmentCard key={garment.id} product={garment} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Editorial Split Atelier Manifesto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-[#E8E8E4] bg-[#121212] text-[#FBFBFA] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#A1A1AA]">
                Our Philosophy
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">
                Authentic craft. Direct from creators. Zero middlemen.
              </h2>
              <p className="text-xs sm:text-[13px] text-[#A1A1AA] max-w-md leading-relaxed">
                By charging an unyielding static 5% platform take-rate, MINIMAL gives 95% of revenues directly back to fashion designers and apparel craftspeople.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-[#27272A]">
              <Link
                to="/products?gender=Mens"
                className="px-6 py-3 bg-white text-[#121212] text-[11px] font-medium uppercase tracking-fashion hover:bg-[#F4F4F2] transition-colors"
              >
                Men's Department
              </Link>
              <Link
                to="/products?gender=Womens"
                className="px-6 py-3 border border-[#3F3F46] text-[#FBFBFA] text-[11px] font-medium uppercase tracking-fashion hover:border-white transition-colors"
              >
                Women's Atelier
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80"
              alt="Atelier tailoring craftsmanship"
              className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

        </div>
      </section>
    </div>
  );
};

export default HomePage;
