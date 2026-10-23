import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../services/Currency';
import { Store } from 'lucide-react';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group cursor-pointer flex flex-col justify-between"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div>
        <div className="relative aspect-[3/4] bg-secondary/5 rounded-2xl overflow-hidden mb-3 border border-secondary/10">
          <img 
            src={product.main_image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60"} 
            alt={product.name} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-secondary/60 uppercase font-bold tracking-wider">
            <span>{product.gender || 'Unisex'} · {product.category_name}</span>
            {product.store_name && (
              <span className="flex items-center gap-1 text-accent lowercase text-xs font-semibold">
                <Store size={12} /> {product.store_name}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-secondary group-hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="font-black text-secondary text-base">
          {formatCurrency(product.base_price)}
        </p>
        {product.brand && (
          <span className="text-[11px] font-semibold text-secondary/50 truncate max-w-[120px]">
            {product.brand}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
