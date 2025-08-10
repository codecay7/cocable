import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Scissors, ArrowUpRightSquare, Menu, Eraser, CopyPlus, Palette } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from './ui/button';
import { useSession } from '@/hooks/useSession';
import { UserNav } from './UserNav';
import { Skeleton } from './ui/skeleton';
import { gsap } from 'gsap';

const tools = [
  {
    name: "Background Remover",
    path: "/clearcut",
    description: "Instantly remove the background from any image.",
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    name: "AI Image Upscaler",
    path: "/upscaler",
    description: "Increase image resolution without losing quality.",
    icon: <ArrowUpRightSquare className="h-5 w-5" />,
  },
  {
    name: "AI Object Remover",
    path: "/object-remover",
    description: "Erase unwanted objects or people from photos.",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    name: "AI Photo Colorizer",
    path: "/colorizer",
    description: "Bring black and white photos to life.",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    name: "Batch Remover",
    path: "/batch-remover",
    description: "Process dozens of images at once.",
    icon: <CopyPlus className="h-5 w-5" />,
  },
];

export const Header = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { session, loading } = useSession();

  useEffect(() => {
    if (isSheetOpen) {
      // Animate links in
      gsap.fromTo(".mobile-nav-link", {
        opacity: 0,
        x: -30,
      }, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.2 // Wait for sheet to slide in
      });
    }
  }, [isSheetOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/30 backdrop-blur-lg">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center space-x-2 mr-6">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-bold">ClearCut AI</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {tools.map((tool) => (
            <NavLink
              key={tool.name}
              to={tool.path}
              className={({ isActive, isPending }) => cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive && tool.path === window.location.pathname ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
                isPending && "opacity-50"
              )}
            >
              {tool.icon}
              <span>{tool.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />

          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : session ? (
            <UserNav />
          ) : (
            <Button asChild className="hidden md:flex">
              <Link to="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-background/90 backdrop-blur-lg">
                <nav className="flex flex-col space-y-2 mt-8">
                  {tools.map((tool) => (
                    <NavLink
                      key={tool.path}
                      to={tool.path}
                      onClick={() => setIsSheetOpen(false)}
                      className={({ isActive }) => cn(
                        "mobile-nav-link flex items-center space-x-4 p-3 rounded-md text-base font-medium transition-colors",
                        isActive && tool.path === window.location.pathname ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                    >
                      {tool.icon}
                      <span>{tool.name}</span>
                    </NavLink>
                  ))}
                   {!session && (
                    <Button asChild className="w-full mt-6 mobile-nav-link">
                      <Link to="/login" onClick={() => setIsSheetOpen(false)}>Login or Sign Up</Link>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};