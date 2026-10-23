import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Layers, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const BuyerNavbar = () => {
  const { totalItemCount, setIsCartOpen, setIsAiStylistOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setUserRole(localStorage.getItem('userRole'));
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUserRole(null);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Editorial Announcement Bar */}
      <div className="bg-zinc-900 dark:bg-zinc-900 text-zinc-100 text-[11px] font-medium tracking-wider uppercase py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <span>✨ Spring / Summer '26 Collection Online</span>
        <span className="opacity-40">•</span>
        <span className="font-semibold text-amber-300">Complimentary Express Shipping on Orders ₹1,999+</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left: Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white transition-colors">
                MINIMAL<span className="text-blue-600 dark:text-blue-400">.</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Atelier
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold tracking-wide">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400 py-1'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1'
              }
            >
              All Garments
            </NavLink>
            <NavLink
              to="/products?gender=Mens"
              className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
            >
              Men
            </NavLink>
            <NavLink
              to="/products?gender=Womens"
              className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
            >
              Women
            </NavLink>
            <NavLink
              to="/products?gender=Kids"
              className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
            >
              Kids
            </NavLink>
            <NavLink
              to="/brands"
              className="text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
            >
              Brand Directory
            </NavLink>
          </nav>

          {/* Right: Search, AI Stylist, Theme, Account, Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Live Search Form (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search cashmere, blazer, denim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-9 pr-4 py-2 text-xs rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:w-72 transition-all"
              />
              <Search size={14} className="absolute left-3 text-zinc-400" />
            </form>

            {/* AI Stylist Trigger Button */}
            <button
              onClick={() => setIsAiStylistOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 active:scale-95"
              title="Open AI Fashion Stylist"
            >
              <Sparkles size={14} className="text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="hidden sm:inline">AI Stylist</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Account / Portal Dropdown or Login */}
            {token ? (
              <div className="relative group">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 p-2 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="My Account"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                    <User size={14} />
                  </div>
                  <ChevronDown size={14} className="text-zinc-400" />
                </Link>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-2 z-50">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Signed In As</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">{userRole || 'Buyer'}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <User size={14} /> My Profile & Orders
                  </Link>

                  {(userRole === 'seller' || userRole === 'brand') && (
                    <Link
                      to="/seller"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    >
                      <Layers size={14} /> Brand Seller Portal
                    </Link>
                  )}

                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    >
                      <ShieldAlert size={14} /> Super Admin Console
                    </Link>
                  )}

                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold px-3 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-white transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center"
              aria-label="Shopping bag"
            >
              <ShoppingBag size={18} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-950 animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-6 space-y-4 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search garments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={16} className="absolute left-3 top-3.5 text-zinc-400" />
          </form>

          <nav className="flex flex-col space-y-3 font-semibold text-sm">
            <Link
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              All Garments
            </Link>
            <Link
              to="/products?gender=Mens"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Men's Collection
            </Link>
            <Link
              to="/products?gender=Womens"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Women's Collection
            </Link>
            <Link
              to="/products?gender=Kids"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Kids Apparel
            </Link>
            <Link
              to="/brands"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Brand Directory
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default BuyerNavbar;
