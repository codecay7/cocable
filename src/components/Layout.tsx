import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MadeWithDyad } from './made-with-dyad';

export const Layout = () => {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1">
        <Outlet />
      </main>
      <div className="border-t">
        <MadeWithDyad />
      </div>
    </div>
  );
};