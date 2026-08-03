import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ isOpen, onClose }) => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    console.log('CartDrawer rendered with cartItems:', cartItems);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Your Cart ({cartItems.length})</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? <p className="text-center text-gray-500 mt-10">Your cart is empty.</p> : cartItems.map(item => (
                        <div key={item.variant_id} className="flex gap-4">
                            
                            {/* FIX IS HERE: Added a fallback image using || */}
                            <img 
                                src={item.image} 
                                className="w-20 h-24 object-cover rounded bg-gray-100" 
                                alt={item.name} 
                            />
                            
                            <div className="flex-1">
                                <h4 className="font-bold">{item.name}</h4>
                                <p className="text-sm text-gray-500">{item.color} / {item.size}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center border rounded">
                                        <button onClick={() => updateQuantity(item.variant_id, item.quantity - 1)} className="px-2 py-1"><Minus size={14} /></button>
                                        <span className="px-2 text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.variant_id, item.quantity + 1)} className="px-2 py-1"><Plus size={14} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.variant_id)} className="text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-between mb-4"><span className="font-bold">Total</span><span className="text-xl font-black">${cartTotal.toFixed(2)}</span></div>
                    <button className="w-full bg-black text-white py-4 rounded font-bold">Checkout Now</button>
                </div>
            </div>
        </div>
    );
};