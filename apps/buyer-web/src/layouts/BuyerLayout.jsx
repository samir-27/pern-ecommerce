import React from 'react';
import { Outlet } from 'react-router-dom';
import BuyerNavbar from '../components/BuyerNavbar';
import BuyerFooter from '../components/BuyerFooter';
import CartDrawer from '../components/CartDrawer';

const BuyerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased transition-colors duration-200">
      <BuyerNavbar />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      <BuyerFooter />
      <CartDrawer />
    </div>
  );
};

export default BuyerLayout;
