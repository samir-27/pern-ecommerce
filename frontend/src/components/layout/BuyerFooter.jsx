import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

const BuyerFooter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-[#E8E8E4] bg-[#FBFBFA] text-[#121212] font-ui transition-colors">
      {/* Brand Value Pillars (Architectural luxury row) */}
      <div className="border-b border-[#E8E8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-start gap-3.5">
              <Truck size={18} strokeWidth={1.5} className="text-[#121212] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-fashion text-[#121212]">
                  Priority Dispatch
                </h4>
                <p className="text-[12px] text-[#71717A] mt-1 leading-relaxed">
                  Direct express delivery from verified fashion ateliers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <ShieldCheck size={18} strokeWidth={1.5} className="text-[#121212] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-fashion text-[#121212]">
                  Authenticity Verified
                </h4>
                <p className="text-[12px] text-[#71717A] mt-1 leading-relaxed">
                  Every atelier is rigorously vetted before catalog release.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <RotateCcw size={18} strokeWidth={1.5} className="text-[#121212] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-fashion text-[#121212]">
                  Doorstep Returns
                </h4>
                <p className="text-[12px] text-[#71717A] mt-1 leading-relaxed">
                  7-day complimentary return & direct exchange service.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Award size={18} strokeWidth={1.5} className="text-[#121212] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-fashion text-[#121212]">
                  Transparent 5% Take
                </h4>
                <p className="text-[12px] text-[#71717A] mt-1 leading-relaxed">
                  Empowering independent makers with fair, ethical commerce.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Editorial Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Info & Newsletter (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-block">
              <span className="font-editorial text-2xl md:text-3xl font-light tracking-[0.06em] text-[#121212]">
                MINIMAL<span className="text-[#843828]">.</span>
              </span>
            </Link>
            
            <p className="text-[13px] text-[#71717A] leading-relaxed max-w-sm">
              An architectural platform curating modern independent fashion labels, bespoke tailoring, and contemporary designer collections.
            </p>

            <div className="pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#121212] block mb-3">
                Newsletter · The Atelier Gazette
              </span>
              {subscribed ? (
                <div className="flex items-center gap-2 text-[12px] text-[#121212] bg-[#EFEFEA] border border-[#E8E8E4] p-3 rounded-none">
                  <Check size={14} className="text-[#843828]" />
                  <span>Thank you. You have been added to the private mailing list.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md">
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-[#E8E8E4] border-r-0 text-[#121212] placeholder-[#A1A1AA] focus:outline-none focus:border-[#121212] transition-colors rounded-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[11px] font-medium tracking-fashion uppercase transition-colors flex items-center gap-1.5 shrink-0 rounded-none"
                  >
                    <span>Subscribe</span>
                    <ArrowRight size={12} />
                  </button>
                </form>
              )}
              <p className="text-[11px] text-[#A1A1AA] mt-2">
                Curated seasonal releases and atelier previews. Unsubscribe at any time.
              </p>
            </div>
          </div>

          {/* Column 2: Collections (2 columns) */}
          <div className="lg:col-span-2">
            <h5 className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#121212] mb-5">
              Collections
            </h5>
            <ul className="space-y-3 text-[12px] text-[#71717A]">
              <li>
                <Link to="/products?gender=Mens" className="hover:text-[#121212] transition-colors">
                  Men's Tailoring
                </Link>
              </li>
              <li>
                <Link to="/products?gender=Womens" className="hover:text-[#121212] transition-colors">
                  Women's Atelier
                </Link>
              </li>
              <li>
                <Link to="/products?gender=Unisex" className="hover:text-[#121212] transition-colors">
                  Unisex Essentials
                </Link>
              </li>
              <li>
                <Link to="/products?category=Jackets%20%26%20Outerwear" className="hover:text-[#121212] transition-colors">
                  Outerwear & Coats
                </Link>
              </li>
              <li>
                <Link to="/products?category=Suits%20%26%20Blazers" className="hover:text-[#121212] transition-colors">
                  Suits & Blazers
                </Link>
              </li>
              <li>
                <Link to="/brands" className="hover:text-[#121212] transition-colors">
                  Atelier Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Services (2 columns) */}
          <div className="lg:col-span-2">
            <h5 className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#121212] mb-5">
              Client Care
            </h5>
            <ul className="space-y-3 text-[12px] text-[#71717A]">
              <li>
                <Link to="/profile" className="hover:text-[#121212] transition-colors">
                  Track Consignment
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#121212] transition-colors">
                  Returns & Claims
                </Link>
              </li>
              <li>
                <span className="hover:text-[#121212] cursor-pointer transition-colors">
                  Shipping Timetable
                </span>
              </li>
              <li>
                <span className="hover:text-[#121212] cursor-pointer transition-colors">
                  Garment Sizing Matrix
                </span>
              </li>
              <li>
                <span className="hover:text-[#121212] cursor-pointer transition-colors">
                  Fabric & Care Guide
                </span>
              </li>
              <li>
                <span className="hover:text-[#121212] cursor-pointer transition-colors">
                  Concierge Support
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Brand Partners & Governance (3 columns) */}
          <div className="lg:col-span-3">
            <h5 className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#121212] mb-5">
              Atelier Partnership
            </h5>
            <ul className="space-y-3 text-[12px] text-[#71717A]">
              <li>
                <Link to="/register" className="text-[#843828] hover:underline font-medium transition-colors">
                  Apply as Partner Atelier →
                </Link>
              </li>
              <li>
                <Link to="/seller" className="hover:text-[#121212] transition-colors">
                  Brand Studio Portal
                </Link>
              </li>
              <li>
                <span className="text-[#71717A]">
                  5.0% Commission Policy
                </span>
              </li>
              <li>
                <span className="hover:text-[#121212] cursor-pointer transition-colors">
                  Dispatch & Fulfillment Guide
                </span>
              </li>
              <li className="pt-3 border-t border-[#E8E8E4]">
                <Link to="/admin/login" className="text-[11px] text-[#A1A1AA] hover:text-[#121212] transition-colors inline-flex items-center gap-1">
                  <span>Platform Command Center</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Currency Bar */}
        <div className="mt-16 pt-8 border-t border-[#E8E8E4] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
          <div className="flex items-center gap-3">
            <span className="font-tabular font-medium text-[#121212]">IN / INR (₹)</span>
            <span>·</span>
            <span>ENGLISH</span>
            <span>·</span>
            <p>© {new Date().getFullYear()} MINIMAL ATELIER TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
          </div>
          <div className="flex items-center space-x-6 text-[#71717A]">
            <span className="hover:text-[#121212] cursor-pointer transition-colors">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-[#121212] cursor-pointer transition-colors">Terms of Atelier</span>
            <span>·</span>
            <span className="hover:text-[#121212] cursor-pointer transition-colors">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BuyerFooter;
