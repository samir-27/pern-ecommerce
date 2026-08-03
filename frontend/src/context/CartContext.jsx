import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

// --- 1. CART CONTEXT ---
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('min_cart');
            if (saved) setCartItems(JSON.parse(saved));
        } catch (e) {
            setCartItems([]);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) localStorage.setItem('min_cart', JSON.stringify(cartItems));
    }, [cartItems, isLoaded]);

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
                price: variant.price_override || product.base_price,
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

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);