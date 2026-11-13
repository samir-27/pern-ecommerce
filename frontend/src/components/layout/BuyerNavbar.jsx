import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X, 
  LogOut, 
  ShieldAlert,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const BuyerNavbar = () => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setUserRole(localStorage.getItem('userRole'));
    setIsMobileMenuOpen(false);
    setIsSearchExpanded(false);
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
      setIsSearchExpanded(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#E8E8E4] transition-all">
      {/* 1. Top Atelier Micro Bar */}
      <div className="w-full bg-[#121212] text-[#FBFBFA] px-4 sm:px-8 py-2 text-[10px] font-medium tracking-[0.18em] uppercase flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-[#A1A19A]">Spring / Summer '26 Editorial Capsule</span>
          <span className="text-[#404040]">•</span>
          <span>Complimentary Express Shipping on Orders Over ₹1,999</span>
        </div>
        <div className="flex items-center gap-6 ml-auto">
          <Link to="/seller" className="text-[#D4D4CE] hover:text-white transition-colors flex items-center gap-1.5">
            <Building2 size={11} className="text-[#A1A19A]" />
            <span>Brand Studio</span>
          </Link>
          <span className="text-[#404040]">•</span>
          <Link to="/admin/login" className="text-[#D4D4CE] hover:text-white transition-colors flex items-center gap-1.5">
            <ShieldAlert size={11} className="text-[#A1A19A]" />
            <span>Governance</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Department Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `link-editorial transition-colors ${
                  isActive ? 'text-[#121212] font-bold' : 'text-[#6B6B67] hover:text-[#121212]'
                }`
              }
            >
              All Garments
            </NavLink>
            <NavLink
              to="/products?gender=Mens"
              className="link-editorial text-[#6B6B67] hover:text-[#121212] transition-colors"
            >
              Men
            </NavLink>
            <NavLink
              to="/products?gender=Womens"
              className="link-editorial text-[#6B6B67] hover:text-[#121212] transition-colors"
            >
              Women
            </NavLink>
            <NavLink
              to="/brands"
              className={({ isActive }) =>
                `link-editorial transition-colors ${
                  isActive ? 'text-[#121212] font-bold' : 'text-[#6B6B67] hover:text-[#121212]'
                }`
              }
            >
              Ateliers
            </NavLink>
          </nav>

          {/* Left Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-[#121212] hover:opacity-70 transition-opacity cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Center: Brand Wordmark Logo */}
          <Link to="/" className="text-center group py-2">
            <span className="font-editorial text-2xl sm:text-3xl font-semibold tracking-[-0.03em] uppercase text-[#121212] block">
              MINIMAL<span className="text-[#843828]">.</span>
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#9E9E98] block -mt-1 font-sans">
              Fashion Atelier
            </span>
          </Link>

          {/* Right: Actions (Search, Account, Cart) */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Inline Search (Desktop Expandable) */}
            <div className="relative hidden md:block">
              {isSearchExpanded ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search silhouettes, materials, ateliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 lg:w-72 pl-3 pr-8 py-1.5 text-xs bg-transparent border-b border-[#121212] text-[#121212] placeholder-[#9E9E98] focus:outline-none transition-all font-sans"
                  />
                  <button type="submit" className="absolute right-0 p-1 text-[#121212] cursor-pointer">
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(false)}
                    className="absolute -right-6 text-[#9E9E98] hover:text-[#121212] p-1 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#6B6B67] hover:text-[#121212] transition-colors py-1 cursor-pointer"
                >
                  <Search size={15} />
                  <span>Search</span>
                </button>
              )}
            </div>

            {/* Account / Authentication Link */}
            {token ? (
              <div className="relative group">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#121212] hover:opacity-75 transition-opacity py-1 font-semibold"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Account</span>
                </Link>
                {/* Subtle dropdown on hover */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FFFFFF] border border-[#E8E8E4] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 p-2">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-xs text-[#121212] hover:bg-[#F4F4F1] font-medium"
                  >
                    My Orders & Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-[#843828] hover:bg-[#F4F4F1] font-medium flex items-center justify-between cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[#6B6B67] hover:text-[#121212] transition-colors py-1 font-semibold"
              >
                <span>Sign In</span>
              </Link>
            )}

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 p-1.5 text-[#121212] hover:opacity-70 transition-opacity relative cursor-pointer"
              aria-label={`Shopping bag with ${totalItemCount} garments`}
            >
              <ShoppingBag size={18} />
              <span className="text-xs font-semibold font-tabular">
                [{totalItemCount}]
              </span>
            </button>

          </div>

        </div>
      </div>

      {/* 3. Mobile Navigation Drawer / Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E8E4] bg-[#FBFBFA] px-6 py-8 space-y-8 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search garments, textures, ateliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E8E4] text-xs text-[#121212] placeholder-[#9E9E98] focus:outline-none focus:border-[#121212]"
            />
            <button type="submit" className="absolute right-3 top-3.5 text-[#121212]">
              <Search size={16} />
            </button>
          </form>

          <div className="space-y-4 text-xs font-semibold uppercase tracking-[0.18em]">
            <NavLink
              to="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#121212] border-b border-[#E8E8E4]"
            >
              All Garments
            </NavLink>
            <NavLink
              to="/products?gender=Mens"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#6B6B67] hover:text-[#121212] border-b border-[#E8E8E4]"
            >
              Men's Wardrobe
            </NavLink>
            <NavLink
              to="/products?gender=Womens"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#6B6B67] hover:text-[#121212] border-b border-[#E8E8E4]"
            >
              Women's Wardrobe
            </NavLink>
            <NavLink
              to="/brands"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-[#6B6B67] hover:text-[#121212] border-b border-[#E8E8E4]"
            >
              Designer Ateliers
            </NavLink>
          </div>

          <div className="pt-4 border-t border-[#E8E8E4] space-y-3 text-xs text-[#6B6B67]">
            {token ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-[#121212] font-semibold"
                >
                  Client Account & Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-[#843828] font-semibold cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#121212] font-semibold"
              >
                Sign In / Join Client Register
              </Link>
            )}
            <div className="pt-2 flex items-center gap-4 text-[10px] tracking-widest uppercase">
              <Link to="/seller" className="hover:text-[#121212]">Brand Studio</Link>
              <span>•</span>
              <Link to="/admin/login" className="hover:text-[#121212]">Admin Gateway</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default BuyerNavbar;
