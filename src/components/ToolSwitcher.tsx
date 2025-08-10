import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scissors, ArrowUpRightSquare, Eraser, CopyPlus, Palette } from 'lucide-react';

const switcherTools = [
  {
    name: "Background Remover & Changer",
    path: "/clearcut",
    description: "Remove, or replace the background of any image.",
    icon: <Scissors className="h-6 w-6" />,
  },
  {
    name: "AI Image Upscaler",
    path: "/upscaler",
    description: "Increase image resolution without losing quality.",
    icon: <ArrowUpRightSquare className="h-6 w-6" />,
  },
  {
    name: "AI Object Remover",
    path: "/object-remover",
    description: "Erase unwanted objects or people from photos.",
    icon: <Eraser className="h-6 w-6" />,
  },
  {
    name: "AI Photo Colorizer",
    path: "/colorizer",
    description: "Bring old black and white photos to life.",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    name: "Batch Background Remover",
    path: "/batch-remover",
    description: "Process dozens of images at once.",
    icon: <CopyPlus className="h-6 w-6" />,
  },
];

export const ToolSwitcher = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const otherTools = switcherTools.filter(tool => tool.path !== currentPath);

  if (otherTools.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-12 md:py-16 border-t mt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Explore Other Tools</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Finished with this tool? Jump right into another one.
        </p>
      </div>
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {otherTools.map(tool => (
          <Link to={tool.path} key={tool.path} className="block h-full">
            <Card className="h-full flex flex-col text-left p-4 transition-all duration-300 group hover:border-primary hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex-row items-center gap-4 p-2">
                <div className="bg-primary/10 p-3 rounded-lg text-primary">{tool.icon}</div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <CardDescription>{tool.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};