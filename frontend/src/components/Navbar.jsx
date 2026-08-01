import { FaUserCircle } from "react-icons/fa";
import { MdOutlineShoppingCart } from "react-icons/md";

const Navbar = () => {
 return (

    <nav className="bg-secondary text-dominant sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-black text-secondary group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-bold text-xl tracking-widest uppercase">Void.</span>
          </div>

          <div className="hidden md:flex space-x-8">
            <button className="text-dominant hover:text-accent font-medium transition-colors">
              Home
            </button>
            <button className="text-dominant hover:text-accent font-medium transition-colors">
              Products
            </button>
          </div>


        </div>
      </div>
    </nav>
  );
}

export default Navbar