import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

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
  const totalItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-ui">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-[#FBFBFA] text-[#121212] border-l border-[#E8E8E4] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E8E8E4] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#843828] block">
                Atelier Consignment
              </span>
              <h2 className="font-editorial text-2xl font-light text-[#121212]">
                Shopping Bag <span className="font-tabular text-base text-[#71717A]">[ {totalItemCount} ]</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#71717A] hover:text-[#121212] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Shipping Progress Gauge */}
          <div className="bg-[#F4F4F2] px-6 py-3 border-b border-[#E8E8E4]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-medium text-[#121212]">
                {amountRemaining > 0 
                  ? `Add ₹${amountRemaining.toLocaleString('en-IN')} for complimentary express dispatch`
                  : 'Complimentary express dispatch unlocked'}
              </span>
              <span className="font-tabular font-medium text-[#71717A]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E8E8E4] h-1 overflow-hidden">
              <div 
                className="bg-[#121212] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <p className="font-editorial text-2xl font-light text-[#121212]">Your Bag is Empty</p>
                <p className="text-xs text-[#71717A] max-w-xs mx-auto leading-relaxed">
                  Discover refined tailoring, bespoke suits, and minimal essentials from our partner ateliers.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/products');
                    }}
                    className="px-6 py-2.5 bg-[#121212] hover:bg-[#843828] text-white text-[10px] font-medium uppercase tracking-fashion transition-colors"
                  >
                    Explore Garments
                  </button>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div 
                  key={item.cartKey}
                  className="flex gap-4 p-3 bg-white border border-[#E8E8E4]"
                >
                  {/* Item Image (3:4 ratio) */}
                  <div className="w-20 aspect-[3/4] overflow-hidden bg-[#F4F4F2] border border-[#E8E8E4] shrink-0">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-medium uppercase tracking-fashion text-[#71717A] block">
                            {item.brand_name || 'Atelier'}
                          </span>
                          <h4 className="font-ui text-xs font-medium text-[#121212] line-clamp-1">
                            {item.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartKey)}
                          className="text-[#A1A1AA] hover:text-[#843828] p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Variant Badges */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#71717A]">
                        <span className="font-tabular bg-[#F4F4F2] px-1.5 py-0.5 border border-[#E8E8E4]">
                          Size: {item.selectedSize}
                        </span>
                        {item.selectedColor && item.selectedColor !== 'Default' && (
                          <span className="bg-[#F4F4F2] px-1.5 py-0.5 border border-[#E8E8E4]">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Tabular Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E8E4]/60">
                      <div className="flex items-center border border-[#E8E8E4] bg-white h-7">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          className="px-2 h-full hover:bg-[#F4F4F2] text-[#121212] transition-colors cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-[11px] font-tabular font-medium text-[#121212]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                          className="px-2 h-full hover:bg-[#F4F4F2] text-[#121212] transition-colors cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="font-tabular text-[13px] font-semibold text-[#121212]">
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
            <div className="p-6 border-t border-[#E8E8E4] bg-white space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-semibold uppercase tracking-loose-caps text-[#71717A]">
                  Consignment Subtotal
                </span>
                <span className="font-tabular text-xl font-semibold text-[#121212]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Taxes and courier tracking applied at checkout. Guaranteed 100% verified atelier authenticity.
              </p>
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-6 text-[11px] font-medium uppercase tracking-fashion bg-[#121212] hover:bg-[#843828] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
