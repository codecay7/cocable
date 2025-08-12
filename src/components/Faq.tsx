import React, { useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: "Is Cocable AI completely free to use?",
    answer: "Yes, all tools on Cocable AI are currently free to use without any limits. We believe in providing powerful image editing capabilities to everyone."
  },
  {
    question: "What image formats do you support?",
    answer: "We support the most common image formats, including PNG, JPG/JPEG, and WEBP. For best results with background removal, we recommend using images with clear subjects."
  },
  {
    question: "Do I need to create an account to use the tools?",
    answer: "No account needed! You can start editing your images right away. We value your time and privacy, so we've made the process as seamless as possible."
  },
  {
    question: "Are my images stored on your servers?",
    answer: "Your privacy is our top priority. All image processing is done directly in your browser. Your images are never uploaded to or stored on our servers."
  }
];

export const Faq = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, 
        { y: 50, opacity: 0 }, 
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="container mx-auto py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto mt-12">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};