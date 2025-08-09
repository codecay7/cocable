import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Instantly Remove Backgrounds with <span className="text-primary">ClearCut AI</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground">
          Upload any image and let our AI-powered tool remove the background in seconds. Perfect for e-commerce, marketing, and creative projects.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/clearcut">
              <Zap className="mr-2 h-5 w-5" />
              Start Removing Backgrounds
            </Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-4">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;