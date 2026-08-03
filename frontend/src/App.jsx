import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductsPage from './pages/Products'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ProductDetailsPage from './components/ProductDetail'
import AuthPage from './pages/AuthPage'

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const MainLayout = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <Navbar cartItemCount={2} />
    <Outlet />
  </div>
);

// --- Main App Component ---

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes: No Navbar, no extra padding */}
        <Route path="/login" element={<AuthPage type="login" />} />
        <Route path="/register" element={<AuthPage type="register" />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
