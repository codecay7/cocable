import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Scissors, ArrowUpRightSquare, Eraser, ImageIcon, CopyPlus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tools = [
  {
    name: "AI Background Remover",
    path: "/clearcut",
    description: "Instantly remove the background from any image with one click.",
    icon: <Scissors className="h-8 w-8 mb-4 text-primary" />,
    status: 'live',
  },
  {
    name: "AI Image Upscaler",
    path: "/upscaler",
    description: "Increase image resolution by 2x or 4x without losing quality.",
    icon: <ArrowUpRightSquare className="h-8 w-8 mb-4 text-primary" />,
    status: 'live',
  },
  {
    name: "AI Object Remover",
    path: "/object-remover",
    description: "Erase unwanted objects, people, or text from your photos.",
    icon: <Eraser className="h-8 w-8 mb-4 text-primary" />,
    status: 'live',
  },
  {
    name: "AI Background Changer",
    path: "#",
    description: "Replace backgrounds with solid colors or custom images.",
    icon: <ImageIcon className="h-8 w-8 mb-4 text-primary" />,
    status: 'coming_soon',
  },
  {
    name: "Batch Background Removal",
    path: "#",
    description: "Process dozens of images at once to save time.",
    icon: <CopyPlus className="h-8 w-8 mb-4 text-primary" />,
    status: 'coming_soon',
  }
];

const ToolCard = ({ tool, index }: { tool: typeof tools[0], index: number }) => {
  const isLive = tool.status === 'live';

  const cardContent = (
    <Card className={cn(
      "text-center h-full flex flex-col transition-all duration-300 group",
      isLive ? "hover:border-primary hover:shadow-lg hover:-translate-y-2 cursor-pointer" : "bg-muted/50 opacity-70"
    )}>
      <CardHeader>
        {tool.icon}
        <CardTitle>{tool.name}</CardTitle>
        {tool.status === 'coming_soon' && <Badge variant="secondary" className="absolute top-4 right-4">Coming Soon</Badge>}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <CardDescription>{tool.description}</CardDescription>
        {isLive && (
          <div className="mt-6 flex items-center justify-center text-sm font-semibold text-primary">
            Use Tool <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </CardContent>
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
    <div ref={containerRef} className="container flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center max-w-3xl mb-12">
        <h1 className="anim-title text-5xl md:text-6xl font-bold tracking-tight">
          Your All-in-One <span className="text-primary">AI Image Editing</span> Toolkit
        </h1>
        <p className="anim-p mt-6 text-lg md:text-xl text-muted-foreground">
          From background removal to AI-powered upscaling, ClearCut AI provides a full suite of tools to perfect your images instantly.
        </p>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <ToolCard key={tool.name} tool={tool} index={index} />
        ))}
      </div>
    </div>
  );
};

export default Index;