import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToolSwitcher } from './ToolSwitcher';
import { Footer } from './Footer';

export const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
        {!isHomePage && <ToolSwitcher />}
      </main>
      <Footer />
    </div>
  );
};