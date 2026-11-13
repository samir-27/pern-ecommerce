import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Layers, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const BuyerNavbar = () => {
  const { totalItemCount, setIsCartOpen, setIsAiStylistOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(localStorage.getItem('token'));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserRole(localStorage.getItem('userRole'));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUserRole(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* 1. Left: Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white lg:hidden transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-950 dark:text-white font-mono uppercase">
                MINIMAL<span className="text-blue-600 dark:text-blue-400">.</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Atelier
              </span>
            </Link>
          </div>

          {/* 2. Middle: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition-colors hover:text-zinc-950 dark:hover:text-white ${
                  isActive ? 'text-zinc-950 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `transition-colors hover:text-zinc-950 dark:hover:text-white ${
                  isActive ? 'text-zinc-950 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                }`
              }
            >
              Shop All
            </NavLink>
            <NavLink
              to="/brands"
              className={({ isActive }) =>
                `transition-colors hover:text-zinc-950 dark:hover:text-white ${
                  isActive ? 'text-zinc-950 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                }`
              }
            >
              Brand Ateliers
            </NavLink>
          </nav>

          {/* 3. Right: Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Input Bar (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <Search size={15} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search garments, ateliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-9 pr-4 py-2 text-xs rounded-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none transition-all"
              />
            </form>

            {/* Shopping Bag Icon Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag size={20} />
              {totalItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Account / Portal Access Button */}
            {token ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-xs font-medium"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">My Profile</span>
                </Link>

                {/* Seller Portal Quick Action */}
                {(userRole === 'seller' || userRole === 'brand') && (
                  <Link
                    to="/seller"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                  >
                    <Layers size={14} /> Brand Studio
                  </Link>
                )}

                {/* Super Admin Quick Action */}
                {(userRole === 'super_admin' || userRole === 'admin') && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
                  >
                    <ShieldAlert size={14} /> Admin Hub
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-6 space-y-4 animate-slide-down">
          <form onSubmit={handleSearch} className="flex items-center relative">
            <Search size={16} className="absolute left-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search garments, ateliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
            />
          </form>

          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Shop All Garments
            </Link>
            <Link
              to="/brands"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Brand Ateliers
            </Link>

            {token && (
              <>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800"></div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2"
                >
                  <User size={16} /> My Profile & Orders
                </Link>

                {(userRole === 'seller' || userRole === 'brand') && (
                  <Link
                    to="/seller"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 font-semibold"
                  >
                    <Layers size={16} /> Brand Operations Studio
                  </Link>
                )}

                {(userRole === 'super_admin' || userRole === 'admin') && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-2 font-semibold"
                  >
                    <ShieldAlert size={16} /> Super Admin Command Center
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default BuyerNavbar;
