import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <footer className="buyer-site-footer border-t border-[#dcd8d0] transition-colors">
      {/* Brand Value Pillars */}
      <div className="border-b border-[#dcd8d0] bg-[#f1eee7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#f0e4df] text-[#783F32] flex items-center justify-center shrink-0 border border-[#dcc6bd]">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em]">Express Delivery</h4>
                <p className="text-xs mt-0.5">Dispatched within 24h via priority air cargo</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#edf0e8] text-[#386447] flex items-center justify-center shrink-0 border border-[#d6e0d0]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em]">100% Verified Brands</h4>
                <p className="text-xs mt-0.5">Authenticity guaranteed with strict brand vetting</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#f4efe8] text-[#7d5e4a] flex items-center justify-center shrink-0 border border-[#e6d9cf]">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em]">Hassle-Free Returns</h4>
                <p className="text-xs mt-0.5">7-day doorstep return & instant exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#f3e8e4] text-[#783F32] flex items-center justify-center shrink-0 border border-[#e2c8be]">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em]">AI Personal Stylist</h4>
                <p className="text-xs mt-0.5">Curated capsule recommendations in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-black tracking-tighter" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                MINIMAL<span className="text-[#783F32]">.</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm">
              The premier destination for modern luxury fashion, connecting discerning buyers with verified independent brands, ateliers, and apparel creators.
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] block mb-2">
                Join the Private Atelier Club
              </span>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg">
                  <CheckCircle2 size={16} />
                  <span>Welcome! You'll receive private drops & runway previews.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-[#fffdfa] border border-[#d9d3c9] text-[#20201E] placeholder-[#7c766f] focus:outline-none focus:ring-1 focus:ring-[#783F32]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#783F32] hover:bg-[#603127] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>Join</span>
                    <ArrowRight size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2: Department */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Department</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
              <li><Link to="/products?gender=Mens" className="hover:text-white transition-colors">Men's Apparel</Link></li>
              <li><Link to="/products?gender=Womens" className="hover:text-white transition-colors">Women's Couture</Link></li>
              <li><Link to="/products?gender=Kids" className="hover:text-white transition-colors">Junior Collection</Link></li>
              <li><Link to="/products?category=Jackets%20%26%20Outerwear" className="hover:text-white transition-colors">Jackets & Outerwear</Link></li>
              <li><Link to="/products?category=Suits%20%26%20Blazers" className="hover:text-white transition-colors">Suits & Blazers</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors">Partner Brands</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Concierge */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Customer Concierge</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
              <li><Link to="/profile" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Exchange & Returns</Link></li>
              <li><a href="#shipping" className="hover:text-white transition-colors">Shipping Schedule</a></li>
              <li><a href="#size-guide" className="hover:text-white transition-colors">Garment Sizing Matrix</a></li>
              <li><a href="#authenticity" className="hover:text-white transition-colors">Brand Verification Ethos</a></li>
              <li><a href="#help" className="hover:text-white transition-colors">24/7 Client Advisory</a></li>
            </ul>
          </div>

          {/* Column 4: Brand Partners */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Brand Partners</h5>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
              <li><Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Register Your Brand</Link></li>
              <li><Link to="/seller" className="hover:text-white transition-colors">Brand Studio Login</Link></li>
              <li><a href="#commission" className="hover:text-white transition-colors">Commission Structure</a></li>
              <li><a href="#fulfillment" className="hover:text-white transition-colors">Fulfillment Logistics</a></li>
              <li><Link to="/admin/login" className="text-zinc-500 hover:text-zinc-400 text-[11px] block pt-3 transition-colors">Super Admin Portal →</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Trademark Bar */}
        <div className="mt-14 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} MINIMAL Technologies Inc. All rights reserved. High Fashion E-Commerce.</p>
          <div className="flex items-center space-x-6 text-zinc-400">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Merchant Agreement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BuyerFooter;
