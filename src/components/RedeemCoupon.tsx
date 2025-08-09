import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';

export const RedeemCoupon = () => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !user) return;

    setIsLoading(true);
    const { data, error } = await supabase.rpc('redeem_coupon', {
      coupon_code_param: couponCode.trim(),
    });

    if (error) {
      if (error.message.includes('invalid_or_inactive_coupon')) {
        showError('This coupon is invalid or has expired.');
      } else if (error.message.includes('coupon_already_redeemed')) {
        showError('You have already redeemed this coupon.');
      } else {
        showError('An error occurred. Please try again.');
        console.error(error);
      }
    } else {
      showSuccess(`Successfully redeemed! ${data} credits have been added to your account.`);
      await queryClient.invalidateQueries({ queryKey: ['credits', user.id] });
      setCouponCode('');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleRedeem} className="p-4 border-t mt-4 space-y-3">
      <Label htmlFor="coupon-code" className="font-semibold">Have a coupon code?</Label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          placeholder="e.g., FREE20"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !couponCode.trim()}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Redeem
        </Button>
      </div>
    </form>
  );
};