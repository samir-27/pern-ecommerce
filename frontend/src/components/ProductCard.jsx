import { ShoppingBag } from 'lucide-react'
import React from 'react'

const ProductCard = ({ product }) => {
    return (
        <div key={product.id} className="group cursor-pointer">
            <div className="relative aspect-[3/4] bg-secondary/5 rounded-lg overflow-hidden mb-4">
                {/* Using the new main_image URL from the database */}
                <img
                    src={product.main_image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60"}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button className="w-full bg-dominant text-secondary font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-accent hover:text-dominant transition-colors shadow-lg">
                        <ShoppingBag className="w-4 h-4" />
                        View Details
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    {/* Displaying the new Gender field */}
                    <p className="text-xs text-secondary/50 font-bold uppercase tracking-wider mb-1">
                        {product.gender || 'Unisex'} • {product.category_name}
                    </p>
                    <h3 className="text-lg font-bold text-secondary group-hover:text-accent transition-colors">
                        {product.name}
                    </h3>
                </div>
                <p className="font-semibold text-secondary">
                    ${Number(product.base_price).toFixed(2)}
                </p>
            </div>
        </div>
    )
}

export default ProductCard