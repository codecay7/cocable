import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Scissors, ArrowUpRightSquare, Menu, Eraser, CopyPlus } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from './ui/button';

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
    name: "Batch Remover",
    path: "/batch-remover",
    description: "Process dozens of images at once.",
    icon: <CopyPlus className="h-5 w-5" />,
  },
];

export const Header = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {tools.map((tool) => (
                    <NavLink
                      key={tool.path}
                      to={tool.path}
                      onClick={() => setIsSheetOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-start space-x-3 p-3 rounded-md transition-colors",
                        isActive && tool.path === window.location.pathname ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                    >
                      <div className="mt-1">{tool.icon}</div>
                      <div>
                        <p className="font-semibold">{tool.name}</p>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};