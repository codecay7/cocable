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
    question: "How does pricing work? Is it free?",
    answer: "We offer a hybrid model! You get 3 free uses across all our tools every day. For more extensive use, you can purchase credits. Premium features like Batch Processing may require credits from the start."
  },
  {
    question: "Do I need to create an account?",
    answer: "Yes, an account is required to use our tools. This allows us to track your daily free uses, manage your credits, and provide you with a personal gallery to save and access your creations."
  },
  {
    question: "Are my images stored on your servers?",
    answer: "Yes, when you process an image, we save it to your private 'My Creations' gallery for your convenience. You have full control and can view, download, or permanently delete your images from your gallery at any time."
  },
  {
    question: "What are credits and do they expire?",
    answer: "Credits are used for our tools after you've used your free daily allowance. 1 credit typically equals 1 image process. Credits never expire, and you can purchase more from your profile page whenever you need them."
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