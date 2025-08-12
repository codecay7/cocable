import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Gift } from 'lucide-react';
import { toast } from 'sonner';

export const PromoBanner = () => {
  const couponCode = 'FREE20';

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode).then(() => {
      toast.success("Code copied! Redeem it in your profile's 'Usage & Credits' section.");
    }, () => {
      toast.error("Failed to copy code.");
    });
  };

  return (
    <section >
      <div className="container mx-auto p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-blue-400 rounded-md text-black m-4">
        <div className="flex items-center gap-4">
          <Gift className="w-10 h-10" />
          <div>
            <h3 className="text-xl font-bold">New User Offer!</h3>
            <p className="text-sm opacity-90">Get 20 free credits to try out all our features.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background/20 p-2 rounded-lg">
          <span className="font-mono text-lg font-bold tracking-widest">{couponCode}</span>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="hover:bg-background/30">
            <Copy className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};