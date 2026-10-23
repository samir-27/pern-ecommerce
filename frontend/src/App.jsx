import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductsPage from './pages/Products';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProductDetailsPage from './components/ProductDetail';
import AuthPage from './pages/AuthPage';
import { CartProvider } from './context/CartContext';
import { useCart } from './context/useCart';
import { CartDrawer } from './components/Cart';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './components/Checkout';
import StorefrontPage from './pages/StorefrontPage';
import StoresDirectoryPage from './pages/StoresDirectoryPage';
import AIFashionAssistant from './components/AIFashionAssistant';

// Dedicated Brand Seller Application
import BrandSellerLayout from '../../apps/brand-seller-web/src/layouts/BrandSellerLayout';
import BrandOverviewPage from '../../apps/brand-seller-web/src/pages/BrandOverviewPage';
import BrandProfilePage from '../../apps/brand-seller-web/src/pages/BrandProfilePage';
import BrandProductsPage from '../../apps/brand-seller-web/src/pages/BrandProductsPage';
import BrandOrdersPage from '../../apps/brand-seller-web/src/pages/BrandOrdersPage';
import BrandAnalyticsPage from '../../apps/brand-seller-web/src/pages/BrandAnalyticsPage';

// Standalone Super Admin Application
import SuperAdminLayout from '../../apps/super-admin-web/src/layouts/SuperAdminLayout';
import SuperAdminLoginPage from '../../apps/super-admin-web/src/pages/SuperAdminLoginPage';
import SuperAdminOverviewPage from '../../apps/super-admin-web/src/pages/SuperAdminOverviewPage';
import SuperAdminBrandsPage from '../../apps/super-admin-web/src/pages/SuperAdminBrandsPage';
import SuperAdminBuyersPage from '../../apps/super-admin-web/src/pages/SuperAdminBuyersPage';
import SuperAdminProductsPage from '../../apps/super-admin-web/src/pages/SuperAdminProductsPage';
import SuperAdminOrdersPage from '../../apps/super-admin-web/src/pages/SuperAdminOrdersPage';
import SuperAdminAuditPage from '../../apps/super-admin-web/src/pages/SuperAdminAuditPage';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (role === 'admin' || role === 'super_admin') ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

const SellerRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (role === 'seller' || role === 'brand' || role === 'admin' || role === 'super_admin') 
    ? <Outlet /> 
    : <Navigate to="/login" replace />;
};

const MainLayout = ({ onCartClick, onOpenAiStylist }) => {
    const { cartItems } = useCart();
    
    return (
        <div className="min-h-screen bg-dominant text-secondary flex flex-col antialiased w-full">
            <Navbar cartItemCount={cartItems.length} onCartClick={onCartClick} onOpenAiStylist={onOpenAiStylist} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>
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
          {/* ============================================================== */}
          {/* 1. BUYER APPLICATION (Storefront, Cart, Checkout, Profile)     */}
          {/* ============================================================== */}
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/register" element={<AuthPage type="register" />} />

          <Route element={<MainLayout onCartClick={() => setIsCartOpen(true)} onOpenAiStylist={() => setIsAiStylistOpen(true)} />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/stores" element={<StoresDirectoryPage />} />
            <Route path="/stores/:slug" element={<StorefrontPage />} />
            <Route path="/brands" element={<StoresDirectoryPage />} />
            <Route path="/brands/:slug" element={<StorefrontPage />} />
            
            {/* Authenticated Customer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ============================================================== */}
          {/* 2. DEDICATED BRAND SELLER APPLICATION (Brand Studio Portal)     */}
          {/* ============================================================== */}
          <Route element={<SellerRoute />}>
            <Route path="/seller" element={<BrandSellerLayout><BrandOverviewPage /></BrandSellerLayout>} />
            <Route path="/seller/profile" element={<BrandSellerLayout><BrandProfilePage /></BrandSellerLayout>} />
            <Route path="/seller/products" element={<BrandSellerLayout><BrandProductsPage /></BrandSellerLayout>} />
            <Route path="/seller/orders" element={<BrandSellerLayout><BrandOrdersPage /></BrandSellerLayout>} />
            <Route path="/seller/analytics" element={<BrandSellerLayout><BrandAnalyticsPage /></BrandSellerLayout>} />
          </Route>

          {/* ============================================================== */}
          {/* 3. STANDALONE SUPER ADMIN APPLICATION (Governance Console)      */}
          {/* ============================================================== */}
          <Route path="/admin/login" element={<SuperAdminLoginPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<SuperAdminLayout><SuperAdminOverviewPage /></SuperAdminLayout>} />
            <Route path="/admin/brands" element={<SuperAdminLayout><SuperAdminBrandsPage /></SuperAdminLayout>} />
            <Route path="/admin/buyers" element={<SuperAdminLayout><SuperAdminBuyersPage /></SuperAdminLayout>} />
            <Route path="/admin/products" element={<SuperAdminLayout><SuperAdminProductsPage /></SuperAdminLayout>} />
            <Route path="/admin/orders" element={<SuperAdminLayout><SuperAdminOrdersPage /></SuperAdminLayout>} />
            <Route path="/admin/audit-logs" element={<SuperAdminLayout><SuperAdminAuditPage /></SuperAdminLayout>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Buyer Drawers */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AIFashionAssistant isOpen={isAiStylistOpen} onClose={() => setIsAiStylistOpen(false)} />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
