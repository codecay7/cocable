import React, { useEffect, useRef } from 'react';
import { Wand2 } from 'lucide-react';
import { gsap } from 'gsap';

interface CreativeLoaderProps {
  onComplete: () => void;
}

export const CreativeLoader: React.FC<CreativeLoaderProps> = ({ onComplete }) => {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete });

    // Initial state
    gsap.set(".loader-element", { opacity: 0, scale: 0.5 });
    gsap.set(".loader-text", { opacity: 0, y: 20 });
    gsap.set(".loader-line", { scaleX: 0 });

    tl.to(loaderRef.current, { opacity: 1, duration: 0.5 })
      // Animate icon
      .to(".loader-icon", { opacity: 1, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" }, "-=0.2")
      // Animate text
      .to(".loader-text", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.5")
      // Animate line
      .to(".loader-line", { scaleX: 1, duration: 1, ease: "power2.inOut" }, "+=0.2")
      // Hold for a moment
      .to({}, { duration: 0.5 })
      // Fade out everything
      .to(loaderRef.current, { opacity: 0, duration: 0.7, ease: "power2.in" });

  }, [onComplete]);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{ opacity: 0 }}
    >
      <div className="relative flex flex-col items-center">
        <div className="loader-element loader-icon">
          <Wand2 className="h-16 w-16 text-primary" />
        </div>
        <h1 className="loader-element loader-text text-3xl font-bold tracking-wider mt-4">
          Cocable AI
        </h1>
        <div className="absolute bottom-[-20px] w-48 h-0.5">
          <div className="loader-line h-full bg-primary origin-left" />
        </div>
      </div>
    </div>
  );
};