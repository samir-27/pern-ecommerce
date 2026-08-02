import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { MdOutlineShoppingCart } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Navbar = ({ cartItemCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-dominant sticky top-0 z-50 border-b border-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-black tracking-tighter text-secondary">
              MINIMAL<span className="text-accent">.</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-12">
            <button onClick={() => navigate('/products')} className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200">Shop All</button>
            <button onClick={() => navigate('/products?gender=Mens')} className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200">Men</button>
            <button onClick={() => navigate('/products?gender=Womens')} className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200">Women</button>
            <button className="text-secondary/80 hover:text-accent font-semibold transition-colors duration-200">Collections</button>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button className="text-secondary hover:text-accent transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-secondary hover:text-accent transition-colors">
              <User className="w-5 h-5" />
            </button>
            <button className="text-secondary hover:text-accent transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-dominant text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-secondary">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-dominant border-t border-secondary/10 absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 space-y-4 shadow-lg">
             <button onClick={() => { navigate('/products'); setIsMenuOpen(false); }} className="block w-full text-left py-3 text-secondary font-bold text-lg border-b border-secondary/10">Shop All</button>
             <button onClick={() => { navigate('/products?gender=Mens'); setIsMenuOpen(false); }} className="block w-full text-left py-3 text-secondary font-bold text-lg border-b border-secondary/10">Men</button>
             <button onClick={() => { navigate('/products?gender=Womens'); setIsMenuOpen(false); }} className="block w-full text-left py-3 text-secondary font-bold text-lg border-b border-secondary/10">Women</button>
             <div className="flex gap-6 pt-4">
               <User className="w-6 h-6 text-secondary" />
               <div className="relative">
                 <ShoppingBag className="w-6 h-6 text-secondary" />
                 {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-dominant text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {cartItemCount}
                    </span>
                  )}
               </div>
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar