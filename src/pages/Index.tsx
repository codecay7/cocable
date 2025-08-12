import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Scissors, ArrowUpRightSquare, CopyPlus, ArrowRight, Eraser, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { HowItWorks } from '@/components/HowItWorks';
import { FeaturesHighlight } from '@/components/FeaturesHighlight';
import { Faq } from '@/components/Faq';
import { Cta } from '@/components/Cta';
import { PromoBanner } from '@/components/PromoBanner';
import { Badge } from '@/components/ui/badge';

gsap.registerPlugin(ScrollTrigger);

const tools = [
  {
    name: "AI Background Remover",
    path: "/cocable",
    description: "Instantly remove the background from any image with one click.",
    icon: <Scissors />,
    status: 'live',
  },
  {
    name: "Batch Background Removal",
    path: "/batch-remover",
    description: "Process dozens of images at once to save time.",
    icon: <CopyPlus />,
    status: 'live',
  },
  {
    name: "AI Image Upscaler",
    path: "/upscaler",
    description: "Increase image resolution by 2x or 4x without losing quality.",
    icon: <ArrowUpRightSquare />,
    status: 'coming soon',
  },
  {
    name: "AI Object Remover",
    path: "/object-remover",
    description: "Erase unwanted objects, people, or text from your photos.",
    icon: <Eraser />,
    status: 'coming soon',
  },
];

const ToolCard = ({ tool }: { tool: typeof tools[0] }) => {
  const isLive = tool.status === 'live';

  const cardContent = (
    <Card className={cn(
      "text-center h-full flex flex-col transition-all duration-300 group",
      isLive 
        ? "hover:border-primary hover:shadow-lg hover:-translate-y-2 cursor-pointer" 
        : "opacity-70"
    )}>
      <CardHeader className="items-center">
        <div className={cn(
          "w-16 h-16 flex items-center justify-center rounded-full mb-4 transition-all duration-300",
          isLive 
            ? "bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}>
          {React.cloneElement(tool.icon, { className: "h-8 w-8" })}
        </div>
        <CardTitle className="text-xl">{tool.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{tool.description}</CardDescription>
      </CardContent>
      <CardFooter className="justify-center pt-4">
        {isLive ? (
          <div className="flex items-center text-sm font-semibold text-primary">
            Use Tool <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </div>
        ) : (
          <Badge variant="secondary">Coming Soon</Badge>
        )}
      </CardFooter>
    </Card>
  );

  if (isLive) {
    return <Link to={tool.path} className="anim-card block h-full">{cardContent}</Link>;
  }

  return <div className="anim-card h-full">{cardContent}</div>;
};

const Index = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".anim-title", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".anim-p", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".anim-card", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.1, delay: 0.4 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <section>
        <div className="container flex flex-col items-center justify-center text-center py-36 md:py-24">
          <div className="max-w-4xl mb-16">
            <h1 className="anim-title text-6xl md:text-8xl font-extrabold tracking-tight">
              AI-Powered Image Editing, <span className="text-gradient bg-gradient-to-r from-primary to-purple-400">Simplified.</span>
            </h1>
            <p className="anim-p mt-6 text-lg md:text-xl text-muted-foreground">
              Instantly remove backgrounds, upscale images, and erase objects with our suite of free AI tools.
            </p>
          </div>
          <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      </section>
      
      <PromoBanner />
      <HowItWorks />
      <FeaturesHighlight />
      <Faq />
      <Cta />
    </div>
  );
};

export default Index;