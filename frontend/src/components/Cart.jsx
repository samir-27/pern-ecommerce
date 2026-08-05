import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ isOpen, onClose }) => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

    if (!isOpen) return null;

    const subtotal = cartTotal;
    const estimatedTax = subtotal * 0.08; // Assuming 8% tax for UI purposes
    const finalTotal = subtotal + estimatedTax;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
                onClick={onClose} 
            />
            
            {}
            <div className="relative w-full max-w-md bg-dominant shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-secondary/10">
                
                {}
                <div className="p-6 border-b border-secondary/10 flex justify-between items-center bg-dominant sticky top-0 z-10">
                    <h2 className="text-2xl font-black text-secondary tracking-tight">
                        Your Cart <span className="text-secondary/50 text-lg font-bold">({cartItems.length})</span>
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-secondary/60 hover:text-secondary hover:bg-secondary/5 rounded-full transition-colors"
                        aria-label="Close cart"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                            <Trash2 size={48} className="text-secondary/30" />
                            <p className="text-center text-secondary font-medium text-lg">Your cart is empty.</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.variant_id} className="flex gap-5 group">
                                
                                {}
                                <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded-md bg-secondary/5 border border-secondary/10">
                                    <img 
                                        src={item.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&auto=format&fit=crop"} 
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                                        alt={item.name} 
                                    />
                                </div>
                                
                                {}
                                <div className="flex flex-col flex-1 py-1 justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-secondary text-base leading-tight pr-4">{item.name}</h4>
                                            <button 
                                                onClick={() => removeFromCart(item.variant_id)} 
                                                className="text-secondary/40 hover:text-accent transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary/60">
                                            {item.color} • Size {item.size}
                                        </p>
                                    </div>

                                    {}
                                    <div className="flex items-end justify-between mt-4">
                                        <div className="flex items-center border-2 border-secondary/20 rounded-md overflow-hidden bg-dominant">
                                            <button 
                                                onClick={() => updateQuantity(item.variant_id, item.quantity - 1)} 
                                                className="px-3 py-1.5 text-secondary hover:bg-secondary/10 hover:text-secondary transition-colors"
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="px-4 py-1.5 text-sm font-bold text-secondary border-x-2 border-secondary/10 min-w-[3rem] text-center">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                onClick={() => updateQuantity(item.variant_id, item.quantity + 1)} 
                                                className="px-3 py-1.5 text-secondary hover:bg-secondary/10 hover:text-secondary transition-colors"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <p className="font-black text-secondary text-lg">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-secondary/10 bg-dominant/95 backdrop-blur-md">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-secondary/70 text-sm font-medium">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-secondary/70 text-sm font-medium">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between text-secondary/70 text-sm font-medium">
                                <span>Estimated Tax</span>
                                <span>${estimatedTax.toFixed(2)}</span>
                            </div>
                            
                            <div className="pt-3 mt-3 border-t border-secondary/10 flex justify-between items-end">
                                <span className="font-bold text-secondary text-lg">Total</span>
                                <span className="text-2xl font-black text-secondary">${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <button className="w-full bg-secondary text-dominant hover:bg-accent hover:text-dominant transition-all duration-300 py-4 rounded-md font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2">
                            Proceed to Checkout
                        </button>
                        
                        <p className="text-center text-secondary/40 text-xs mt-4 font-medium flex items-center justify-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                            Secure encrypted checkout
                        </p>
                    </div>
                )}
            </div>
            {/* Added custom scrollbar styling specifically for the cart to keep it sleek */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--color-secondary); opacity: 0.1; border-radius: 10px; }
            `}</style>
        </div>
    );
};