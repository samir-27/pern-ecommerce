import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';

// 1. BUYER APPLICATION (from apps/buyer-web)
import { 
  CartProvider, 
  BuyerLayout, 
  HomePage, 
  ShopPage, 
  ProductDetailPage, 
  BrandsDirectoryPage, 
  BrandProfilePage, 
  CheckoutPage, 
  ProfilePage, 
  AuthPage 
} from '../../apps/buyer-web/src';

// 2. BRAND SELLER APPLICATION (from apps/brand-seller-web)
import BrandSellerLayout from '../../apps/brand-seller-web/src/layouts/BrandSellerLayout';
import BrandOverviewPage from '../../apps/brand-seller-web/src/pages/BrandOverviewPage';
import BrandProfilePage2 from '../../apps/brand-seller-web/src/pages/BrandProfilePage';
import BrandProductsPage from '../../apps/brand-seller-web/src/pages/BrandProductsPage';
import BrandOrdersPage from '../../apps/brand-seller-web/src/pages/BrandOrdersPage';
import BrandAnalyticsPage from '../../apps/brand-seller-web/src/pages/BrandAnalyticsPage';

// 3. STANDALONE SUPER ADMIN APPLICATION (from apps/super-admin-web)
import SuperAdminLayout from '../../apps/super-admin-web/src/layouts/SuperAdminLayout';
import SuperAdminLoginPage from '../../apps/super-admin-web/src/pages/SuperAdminLoginPage';
import SuperAdminOverviewPage from '../../apps/super-admin-web/src/pages/SuperAdminOverviewPage';
import SuperAdminBrandsPage from '../../apps/super-admin-web/src/pages/SuperAdminBrandsPage';
import SuperAdminBuyersPage from '../../apps/super-admin-web/src/pages/SuperAdminBuyersPage';
import SuperAdminProductsPage from '../../apps/super-admin-web/src/pages/SuperAdminProductsPage';
import SuperAdminOrdersPage from '../../apps/super-admin-web/src/pages/SuperAdminOrdersPage';
import SuperAdminAuditPage from '../../apps/super-admin-web/src/pages/SuperAdminAuditPage';

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
            <Route path="/seller/profile" element={<BrandSellerLayout><BrandProfilePage2 /></BrandSellerLayout>} />
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
