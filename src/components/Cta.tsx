import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

export const Cta = () => {
  return (
    <section className="bg-blur">
      <div className="container mx-auto py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to Elevate Your Images?</h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Stop wasting time with complicated software. Start creating stunning visuals with the power of AI today.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/clearcut">
            Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
};