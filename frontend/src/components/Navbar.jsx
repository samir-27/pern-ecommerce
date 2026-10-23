import { Menu, Moon, ShoppingBag, Sun, User, X, Sparkles, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = ({ cartItemCount = 0, onCartClick, onOpenAiStylist }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const role = localStorage.getItem("userRole");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <nav className="bg-dominant/95 backdrop-blur-md sticky top-0 z-40 border-b border-secondary/10 w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-secondary">
              MINIMAL<span className="text-accent">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/products" className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200">
              Shop All
            </NavLink>

            <Link
              to="/products?gender=Mens"
              className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200"
            >
              Men
            </Link>

            <Link
              to="/products?gender=Womens"
              className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200"
            >
              Women
            </Link>

            <Link
              to="/stores"
              className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200 flex items-center gap-1.5"
            >
              <Store size={16} /> Brands
            </Link>

            {(role === "seller" || role === "brand") && (
              <Link
                to="/seller"
                className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
              >
                Brand Studio
              </Link>
            )}

            {(role === "admin" || role === "super_admin") && (
              <Link
                to="/admin"
                className="text-indigo-500 hover:text-indigo-400 font-bold transition-colors"
              >
                Super Admin
              </Link>
            )}

            {!role || role === "user" || role === "customer" ? (
              <Link
                to="/register"
                className="text-xs font-bold uppercase tracking-wider text-secondary/70 hover:text-accent px-3 py-1.5 rounded-full border border-secondary/15 transition"
              >
                Sell as Brand
              </Link>
            ) : null}
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-5">
            {/* AI Stylist Button */}
            <button
              onClick={onOpenAiStylist}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 text-accent hover:bg-accent hover:text-dominant rounded-full text-xs font-bold transition cursor-pointer shadow-sm"
              title="Open AI Fashion Stylist"
            >
              <Sparkles size={15} />
              <span>AI Stylist</span>
            </button>

            <Link
              to="/profile"
              className="text-secondary hover:text-accent transition-colors"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={onCartClick}
              className="text-secondary hover:text-accent transition-colors relative cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-dominant text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            <button onClick={toggleTheme} className="text-secondary hover:text-accent transition-colors cursor-pointer" title="Toggle Theme">
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={onOpenAiStylist}
              className="p-2 text-accent bg-accent/15 rounded-full"
            >
              <Sparkles size={18} />
            </button>

            <button
              onClick={onCartClick}
              className="text-secondary relative p-1"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-dominant text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary hover:text-accent transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary/10 space-y-3">
            <Link
              to="/products"
              onClick={() => setIsMenuOpen(false)}
              className="block font-semibold text-secondary hover:text-accent"
            >
              Shop All
            </Link>
            <Link
              to="/products?gender=Mens"
              onClick={() => setIsMenuOpen(false)}
              className="block font-semibold text-secondary hover:text-accent"
            >
              Men
            </Link>
            <Link
              to="/products?gender=Womens"
              onClick={() => setIsMenuOpen(false)}
              className="block font-semibold text-secondary hover:text-accent"
            >
              Women
            </Link>
            <Link
              to="/stores"
              onClick={() => setIsMenuOpen(false)}
              className="block font-semibold text-secondary hover:text-accent"
            >
              Marketplace Brands
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsMenuOpen(false)}
              className="block font-semibold text-secondary hover:text-accent"
            >
              My Profile & Orders
            </Link>

            {(role === "seller" || role === "admin" || role === "super_admin") && (
              <Link
                to="/seller"
                onClick={() => setIsMenuOpen(false)}
                className="block font-bold text-accent"
              >
                Seller Hub
              </Link>
            )}

            {(role === "admin" || role === "super_admin") && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="block font-bold text-accent"
              >
                Super Admin Dashboard
              </Link>
            )}

            {(!role || role === "user" || role === "customer") && (
              <Link
                to="/seller/apply"
                onClick={() => setIsMenuOpen(false)}
                className="block font-bold text-secondary"
              >
                Become a Seller
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
