import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = ({ cartItemCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  return (
    <nav className="bg-dominant sticky top-0 z-50 border-b border-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-secondary">
              MINIMAL<span className="text-accent">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
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
              to="/collections"
              className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200"
            >
              Collections
            </Link>
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="text-secondary hover:text-accent transition-colors">
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/profile"
              className="text-secondary hover:text-accent transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="text-secondary hover:text-accent transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />

              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-dominant text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dominant border-t border-secondary/10 absolute w-full left-0 shadow-lg">
          <div className="px-4 pt-2 pb-6">
            <Link
              to="/products"
              onClick={() => setIsMenuOpen(false)}
              className="block py-3 text-secondary font-bold text-lg border-b border-secondary/10"
            >
              Shop All
            </Link>

            <Link
              to="/products?gender=Mens"
              onClick={() => setIsMenuOpen(false)}
              className="block py-3 text-secondary font-bold text-lg border-b border-secondary/10"
            >
              Men
            </Link>

            <Link
              to="/products?gender=Womens"
              onClick={() => setIsMenuOpen(false)}
              className="block py-3 text-secondary font-bold text-lg border-b border-secondary/10"
            >
              Women
            </Link>

            <Link
              to="/collections"
              onClick={() => setIsMenuOpen(false)}
              className="block py-3 text-secondary font-bold text-lg border-b border-secondary/10"
            >
              Collections
            </Link>

            <div className="flex gap-6 pt-5">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="text-secondary"
              >
                <User className="w-6 h-6" />
              </Link>

              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="relative text-secondary"
              >
                <ShoppingBag className="w-6 h-6" />

                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-dominant text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;