import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Wand2, Download } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: "1. Upload Your Image",
    description: "Simply drag and drop your photo or select a file from your device. We support PNG, JPG, and WEBP formats.",
  },
  {
    icon: <Wand2 className="h-10 w-10 text-primary" />,
    title: "2. Let AI Do the Magic",
    description: "Choose your desired tool and our powerful AI will process your image in seconds. No complex software needed.",
  },
  {
    icon: <Download className="h-10 w-10 text-primary" />,
    title: "3. Download & Share",
    description: "Your high-resolution result is ready. Download it for free, with no watermarks.",
  },
];

export const HowItWorks = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".how-it-works-card", 
        { y: 50, opacity: 0 }, 
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          ease: "power3.out", 
          stagger: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="container mx-auto py-16 md:py-24 text-center">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How It Works</h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        Achieve professional results in just three simple steps.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <Card key={index} className="how-it-works-card text-center bg-card/60">
            <CardHeader className="items-center">
              {step.icon}
            </CardHeader>
            <CardContent>
              <CardTitle className="mb-2 text-xl">{step.title}</CardTitle>
              <p className="text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};