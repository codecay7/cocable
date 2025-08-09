import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve payment URL.");
      }
    } catch (e: any) {
      showError(e.message || "Failed to start purchase. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Get More Credits</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Unlock more premium features by purchasing a credit pack.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 bg-primary/5 rounded-lg text-center">
          <h3 className="text-3xl font-bold text-primary">50 Credits</h3>
          <p className="text-2xl font-semibold">$5.00</p>
          <p className="text-sm text-muted-foreground">One-time payment</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Use for any premium feature</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Credits never expire</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Secure payment with Stripe</li>
        </ul>
        <DialogFooter>
          <Button onClick={handlePurchase} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            {isLoading ? 'Redirecting to payment...' : 'Buy Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};