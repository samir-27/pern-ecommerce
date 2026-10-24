import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('minimal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiStylistOpen, setIsAiStylistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('minimal_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    setCartItems(prev => {
      const variantKey = selectedVariant 
        ? `${product.id}-${selectedVariant.size || 'default'}-${selectedVariant.color || 'default'}`
        : `${product.id}-default`;

      const existingIndex = prev.findIndex(item => item.cartKey === variantKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const itemPrice = selectedVariant?.price_override 
        ? parseFloat(selectedVariant.price_override)
        : parseFloat(product.base_price || product.price || 0);

      const variantImage = (selectedVariant?.image_urls && selectedVariant.image_urls.length > 0)
        ? selectedVariant.image_urls[0]
        : (selectedVariant?.image_url || product.main_image || (product.images && product.images[0]) || product.image_url || '');

      const newItem = {
        cartKey: variantKey,
        id: product.id,
        name: product.name,
        price: itemPrice,
        image_url: variantImage,
        brand_name: product.brand_name || product.brand || 'MINIMAL Atelier',
        selectedSize: selectedVariant?.size || 'Standard',
        selectedColor: selectedVariant?.color || 'Default',
        variant_id: selectedVariant?.id || null,
        stock_quantity: selectedVariant?.stock_quantity ?? product.stock_quantity ?? 99,
        quantity: quantity,
      };

      return [...prev, newItem];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item)
    );
  };

  const removeFromCart = (cartKey) => {
    setCartItems(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      totalItemCount,
      isCartOpen,
      setIsCartOpen,
      isAiStylistOpen,
      setIsAiStylistOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
