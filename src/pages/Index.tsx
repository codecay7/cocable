import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Index = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-title", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".anim-p", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".anim-btn", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", delay: 0.4 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="container flex flex-1 flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="anim-title text-5xl md:text-6xl font-bold tracking-tight">
          Instantly Remove Backgrounds with <span className="text-primary">ClearCut AI</span>
        </h1>
        <p className="anim-p mt-6 text-lg md:text-xl text-muted-foreground">
          Upload any image and let our AI-powered tool remove the background in seconds. Perfect for e-commerce, marketing, and creative projects.
        </p>
        <div className="anim-btn mt-8">
          <Button asChild size="lg">
            <Link to="/clearcut">
              <Zap className="mr-2 h-5 w-5" />
              Start Removing Backgrounds
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;