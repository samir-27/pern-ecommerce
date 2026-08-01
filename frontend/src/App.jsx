import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductsPage from './pages/Products'

function App() {
  return (
    <>
    <Navbar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    {/* <Home /> */}
    <ProductsPage />
    </div>
    </>
  )
}

export default App
