import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Badge } from './ui/badge';

interface Transaction {
  id: string;
  created_at: string;
  amount_paid: number;
  credits_purchased: number;
  razorpay_payment_id: string;
}

const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};

export const TransactionHistory = () => {
  const { user } = useSession();
  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchTransactions(user!.id),
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Transaction History</CardTitle>
        <CardDescription>A record of your credit purchases.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {isError && <p className="text-destructive text-center">Could not load transaction history.</p>}
        {!isLoading && !isError && (
          transactions && transactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <p className="font-medium">Credit Pack Purchase</p>
                        <Badge variant="outline">+{tx.credits_purchased} credits</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{(tx.amount_paid / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
          )
        )}
      </CardContent>
    </Card>
  );
};