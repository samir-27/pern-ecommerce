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
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import SellerApply from './pages/SellerApply';
import StorefrontPage from './pages/StorefrontPage';
import StoresDirectoryPage from './pages/StoresDirectoryPage';
import AIFashionAssistant from './components/AIFashionAssistant';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (role === 'admin' || role === 'super_admin') ? <Outlet /> : <Navigate to="/" replace />;
};

const SellerRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (role === 'seller' || role === 'admin' || role === 'super_admin') ? <Outlet /> : <Navigate to="/seller/apply" replace />;
};

const MainLayout = ({ onCartClick, onOpenAiStylist }) => {
    const { cartItems } = useCart();
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navbar cartItemCount={cartItems.length} onCartClick={onCartClick} onOpenAiStylist={onOpenAiStylist} />
            <Outlet />
        </div>
    );
};

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiStylistOpen, setIsAiStylistOpen] = useState(false);

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />

          {/* Public & Customer Storefront */}
          <Route element={<MainLayout onCartClick={() => setIsCartOpen(true)} onOpenAiStylist={() => setIsAiStylistOpen(true)} />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/stores" element={<StoresDirectoryPage />} />
            <Route path="/stores/:slug" element={<StorefrontPage />} />
            
            {/* Authenticated Customer routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/seller/apply" element={<SellerApply />} />
            </Route>
          </Route>

          {/* Seller Dashboard */}
          <Route element={<SellerRoute />}>
            <Route path="/seller" element={<SellerDashboard />} />
          </Route>

          {/* Super Admin Dashboard */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Drawers */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AIFashionAssistant isOpen={isAiStylistOpen} onClose={() => setIsAiStylistOpen(false)} />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
