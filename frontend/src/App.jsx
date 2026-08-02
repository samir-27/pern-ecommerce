import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductsPage from './pages/Products'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  const dummyCartCount = 2;

  return (
    <BrowserRouter>
      {/* Adding a global wrapper to enforce font and selection colors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navbar sits outside Routes so it's always visible */}
        <Navbar cartItemCount={dummyCartCount} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
        
      </div>
    </BrowserRouter>
  );
}

export default App
