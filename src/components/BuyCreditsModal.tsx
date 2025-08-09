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
import { showError, showSuccess } from '@/utils/toast';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useQueryClient } from '@tanstack/react-query';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BuyCreditsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useSession();
  const queryClient = useQueryClient();

  const handlePurchase = async () => {
    setIsLoading(true);
    if (!user || !session) {
      showError("You must be logged in to make a purchase.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create an order on the backend
      const { data: order, error: orderError } = await supabase.functions.invoke('create-razorpay-order');
      if (orderError) throw orderError;

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ClearCut AI',
        description: '50 Credits Pack',
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify the payment
          const { error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
          });

          if (verificationError) {
            showError(`Payment verification failed: ${verificationError.message}`);
          } else {
            showSuccess('Payment successful! 50 credits have been added to your account.');
            await queryClient.invalidateQueries({ queryKey: ['credits', user.id] });
            onOpenChange(false);
          }
        },
        prefill: {
          name: user.user_metadata?.first_name || '',
          email: user.email,
        },
        theme: {
          color: '#3b82f6', // A nice blue to match the theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        showError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (e: any) {
      showError(e.message || 'Failed to start purchase. Please try again.');
    } finally {
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
          <p className="text-2xl font-semibold">₹500.00</p>
          <p className="text-sm text-muted-foreground">One-time payment</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Use for any premium feature</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Credits never expire</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Secure payment with Razorpay</li>
        </ul>
        <DialogFooter>
          <Button onClick={handlePurchase} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            {isLoading ? 'Initializing...' : 'Buy Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};