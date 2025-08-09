import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/30 backdrop-blur-lg">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center space-x-2 mr-auto">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-bold">ClearCut AI</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};