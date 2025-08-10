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
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
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
  const { user } = useSession();
  const queryClient = useQueryClient();

  const handlePurchase = async () => {
    setIsLoading(true);

    if (!user) {
      showError("You must be logged in to make a purchase.");
      setIsLoading(false);
      return;
    }

    if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
      showError("Payment provider is not configured. Please contact support.");
      setIsLoading(false);
      return;
    }

    let order;
    const orderToastId = showLoading('Initializing secure payment...');
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order');
      if (error) throw error;
      order = data;
      dismissToast(orderToastId);
      showSuccess('Payment gateway ready.');
    } catch (e: any) {
      dismissToast(orderToastId);
      showError(e.message || 'Could not connect to payment gateway.');
      setIsLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'ClearCut AI',
      description: '50 Credits Pack',
      order_id: order.id,
      handler: async function (response: any) {
        const verificationToastId = showLoading('Verifying payment...');
        try {
          const { error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            },
          });
          dismissToast(verificationToastId);
          if (verificationError) throw verificationError;
          
          showSuccess('Payment successful! 50 credits have been added.');
          await queryClient.invalidateQueries({ queryKey: ['credits', user.id] });
          onOpenChange(false);
        } catch (e: any) {
          dismissToast(verificationToastId);
          showError(e.message || 'Payment verification failed.');
        } finally {
          setIsLoading(false);
        }
      },
      prefill: {
        name: user.user_metadata?.first_name || '',
        email: user.email,
      },
      theme: {
        color: '#3b82f6',
      },
      modal: {
        ondismiss: () => {
          if (isLoading) {
            setIsLoading(false);
            showError('Payment was cancelled.');
          }
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      showError('Could not open payment window.');
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
            {isLoading ? 'Processing...' : 'Buy Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};