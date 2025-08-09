import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MadeWithDyad } from './made-with-dyad';
import { ToolSwitcher } from './ToolSwitcher';
import { Footer } from './Footer';

export const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-sky-100 to-rose-100 dark:from-slate-900 dark:to-rose-950">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
        {!isHomePage && <ToolSwitcher />}
      </main>
      <Footer />
      <div className="border-t bg-transparent">
        <MadeWithDyad />
      </div>
    </div>
  );
};