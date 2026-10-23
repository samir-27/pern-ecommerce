import { useState, useEffect } from 'react';
import { CartContext } from './CartContextDef';

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('min_cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('min_cart', JSON.stringify(cartItems));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
    }, [cartItems]);

    const addToCart = (variant, product, quantity = 1) => {
        setCartItems(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const existing = current.find(item => item.variant_id === variant.id);
            if (existing) {
                return current.map(item => item.variant_id === variant.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...current, {
                variant_id: variant.id,
                name: product.name,
                color: variant.color,
                size: variant.size,
                price: Number(variant.price_override || product.base_price),
                image: variant.image_urls?.[0] || '',
                quantity
            }];
        });
    };

    const removeFromCart = (variantId) => setCartItems(prev => prev.filter(item => item.variant_id !== variantId));
    
    const updateQuantity = (variantId, qty) => {
        if (qty < 1) return removeFromCart(variantId);
        setCartItems(prev => prev.map(item => item.variant_id === variantId ? { ...item, quantity: qty } : item));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};
