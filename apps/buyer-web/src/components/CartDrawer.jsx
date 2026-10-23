import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    subtotal 
  } = useCart();
  
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 1999;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountRemaining = Math.max(0, freeShippingThreshold - subtotal);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Shopping Bag ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Shipping Threshold Progress */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <Truck size={14} className="text-blue-600" />
                {amountRemaining > 0 
                  ? `Add ₹${amountRemaining.toLocaleString('en-IN')} for Free Express Delivery`
                  : '🎉 Congratulations! You have unlocked Free Express Delivery!'}
              </span>
              <span className="text-[11px] font-bold text-zinc-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">Your bag is empty</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Explore our curated designer runway apparel, luxury essentials, and tailored outerwear.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  Explore Garments
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div 
                  key={item.cartKey}
                  className="flex gap-4 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
                >
                  {/* Item Image */}
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {item.brand_name}
                          </span>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                            {item.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartKey)}
                          className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Variant Badges */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300">
                          Size: {item.selectedSize}
                        </span>
                        {item.selectedColor && item.selectedColor !== 'Default' && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="font-black text-sm text-zinc-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-500">Subtotal</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Taxes, customs duties, and doorstep courier calculated at checkout.
              </p>
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
