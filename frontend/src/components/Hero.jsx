import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="py-6">
      <div className="flex gap-6 mt-4 text-sm font-bold tracking-widest text-secondary/60 uppercase">
        <Link to="/products?gender=Mens" className="hover:text-accent transition-colors">MEN</Link>
        <span>·</span>
        <Link to="/products?gender=Womens" className="hover:text-accent transition-colors">WOMEN</Link>
        <span>·</span>
        <Link to="/products?gender=Kids" className="hover:text-accent transition-colors">KIDS</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 items-center">
        <div className="flex flex-col justify-between py-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Curated Independent Designers</span>
            <h1 className="text-4xl md:text-5xl font-black text-secondary leading-tight mt-2">
              NEW <br /><span className="text-accent">COLLECTION.</span>
            </h1>
            <p className="mt-4 text-secondary/70 text-sm leading-relaxed max-w-sm">
              Discover unique apparel crafted by verified independent fashion creators and bespoke studios.
            </p>
          </div>

          <Link to="/products" className="mt-8 px-6 py-4 bg-secondary text-dominant font-bold rounded-lg hover:bg-accent transition-colors inline-flex items-center gap-3 w-fit">
            SHOP MARKETPLACE <FaArrowRight />
          </Link>
        </div>

        <div className="h-80 md:h-96 rounded-2xl overflow-hidden shadow-sm border border-secondary/10">
          <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80" alt="Fashion collection" />
        </div>

        <div className="h-80 md:h-96 rounded-2xl overflow-hidden shadow-sm border border-secondary/10">
          <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80" alt="Sustainable Apparel" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
