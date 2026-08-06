import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductsPage from './pages/Products';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProductDetailsPage from './components/ProductDetail';
import AuthPage from './pages/AuthPage';
import { CartProvider, useCart } from './context/CartContext';
import { CartDrawer } from './components/Cart';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './components/Checkout';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// FIXED: MainLayout now accepts onCartClick and passes it to Navbar
const MainLayout = ({ onCartClick }) => {
    // We get the cart length here to pass to the Navbar badge
    const { cartItems } = useCart();
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navbar cartItemCount={cartItems.length} onCartClick={onCartClick} />
            <Outlet />
        </div>
    );
};

function App() {
  // State for the drawer lives here
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* FIXED: We now pass the function to open the cart down to MainLayout */}
            <Route element={<MainLayout onCartClick={() => setIsCartOpen(true)} />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* The Drawer sits at the app level so it overlays everything */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;