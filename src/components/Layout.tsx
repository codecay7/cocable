import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MadeWithDyad } from './made-with-dyad';

export const Layout = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-sky-100 to-rose-100 dark:from-slate-900 dark:to-rose-950">
      <Header />
      <main className="flex flex-1">
        <Outlet />
      </main>
      <div className="border-t bg-transparent">
        <MadeWithDyad />
      </div>
    </div>
  );
};