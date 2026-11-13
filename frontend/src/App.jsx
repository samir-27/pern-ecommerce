import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';

// Context
import { CartProvider } from '@/context/CartContext';

// Layouts
import BuyerLayout from '@/components/layout/BuyerLayout';
import BrandSellerLayout from '@/components/layout/BrandSellerLayout';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

// Buyer Pages
import HomePage from '@/pages/buyer/HomePage';
import ShopPage from '@/pages/buyer/ShopPage';
import ProductDetailPage from '@/pages/buyer/ProductDetailPage';
import BrandsDirectoryPage from '@/pages/buyer/BrandsDirectoryPage';
import BrandProfilePage from '@/pages/buyer/BrandProfilePage';
import CheckoutPage from '@/pages/buyer/CheckoutPage';
import ProfilePage from '@/pages/buyer/ProfilePage';
import AuthPage from '@/pages/buyer/AuthPage';

// Brand Seller Pages
import BrandOverviewPage from '@/pages/seller/BrandOverviewPage';
import BrandProductsPage from '@/pages/seller/BrandProductsPage';
import BrandOrdersPage from '@/pages/seller/BrandOrdersPage';
import BrandAnalyticsPage from '@/pages/seller/BrandAnalyticsPage';
import SellerBrandProfilePage from '@/pages/seller/BrandProfilePage';

// Super Admin Pages
import SuperAdminLoginPage from '@/pages/admin/SuperAdminLoginPage';
import SuperAdminOverviewPage from '@/pages/admin/SuperAdminOverviewPage';
import SuperAdminBrandsPage from '@/pages/admin/SuperAdminBrandsPage';
import SuperAdminBuyersPage from '@/pages/admin/SuperAdminBuyersPage';
import SuperAdminProductsPage from '@/pages/admin/SuperAdminProductsPage';
import SuperAdminOrdersPage from '@/pages/admin/SuperAdminOrdersPage';
import SuperAdminAuditPage from '@/pages/admin/SuperAdminAuditPage';

// Auth Route Guards
const ProtectedBuyerRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const SellerRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login?mode=seller" replace />;
  }

  return (role === 'seller' || role === 'brand' || role === 'admin' || role === 'super_admin') 
    ? <Outlet /> 
    : <Navigate to="/login?mode=seller" replace />;
};

const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (role === 'admin' || role === 'super_admin') 
    ? <Outlet /> 
    : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* ============================================================== */}
          {/* 1. BUYER APPLICATION (Modern Fashion E-Commerce Storefront)    */}
          {/* ============================================================== */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />

          <Route element={<BuyerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/brands" element={<BrandsDirectoryPage />} />
            <Route path="/brands/:slug" element={<BrandProfilePage />} />
            
            {/* Backward-compatible store aliases redirect to brand routes */}
            <Route path="/stores" element={<Navigate to="/brands" replace />} />
            <Route path="/stores/:slug" element={<Navigate to="/brands" replace />} />

            {/* Authenticated Buyer Flow */}
            <Route element={<ProtectedBuyerRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ============================================================== */}
          {/* 2. DEDICATED BRAND SELLER APPLICATION (Brand Operations Studio)*/}
          {/* ============================================================== */}
          <Route element={<SellerRoute />}>
            <Route path="/seller" element={<BrandSellerLayout><BrandOverviewPage /></BrandSellerLayout>} />
            <Route path="/seller/products" element={<BrandSellerLayout><BrandProductsPage /></BrandSellerLayout>} />
            <Route path="/seller/orders" element={<BrandSellerLayout><BrandOrdersPage /></BrandSellerLayout>} />
            <Route path="/seller/analytics" element={<BrandSellerLayout><BrandAnalyticsPage /></BrandSellerLayout>} />
            <Route path="/seller/profile" element={<BrandSellerLayout><SellerBrandProfilePage /></BrandSellerLayout>} />
          </Route>

          {/* ============================================================== */}
          {/* 3. STANDALONE SUPER ADMIN APPLICATION (Governance Console)     */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
