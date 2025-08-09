import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const FeaturesHighlight = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".feature-text", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } });
      gsap.fromTo(".feature-image", { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: sectionRef.current, start: "top 80%" } });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="container mx-auto py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="feature-text">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One-Click Background Removal</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tired of complex editing software? Our AI instantly detects the subject in your photo and removes the background with stunning accuracy. Perfect for product photos, portraits, and more.
          </p>
          <ul className="mt-6 space-y-2 text-muted-foreground">
            <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-primary" /> Handles tricky details like hair and fur.</li>
            <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-primary" /> Add new backgrounds: colors, gradients, or your own images.</li>
            <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-primary" /> Save time with our batch processing tool.</li>
          </ul>
          <Button asChild size="lg" className="mt-8">
            <Link to="/clearcut">
              Try Background Remover <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="feature-image rounded-lg overflow-hidden shadow-2xl bg-muted/30">
          <img src="/placeholder.svg" alt="Background removal example" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
};