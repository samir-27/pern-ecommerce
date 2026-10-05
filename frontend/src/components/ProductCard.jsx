import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../services/Currency';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  console.log(product.id)
  return (
     <div 
        key={product.id} 
        className="group cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
     >
        {}
        <div className="relative aspect-[3/4] bg-secondary/5 rounded-lg overflow-hidden mb-4">
          <img 
            src={product.main_image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60"} 
            alt={product.name} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          

        </div>
        
        {}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-secondary/50 font-bold uppercase tracking-wider mb-1">
              {product.gender || 'Unisex'} • {product.category_name}
            </p>
            <h3 className="text-lg font-bold text-secondary group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="font-semibold text-secondary">
            {formatCurrency(product.base_price)}
          </p>
        </div>
      </div>
  )
}

export default ProductCard