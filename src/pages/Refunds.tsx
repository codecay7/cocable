import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Refunds = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Cancellations and Refunds Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 prose dark:prose-invert">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>Credit Purchases</h2>
          <p>Thank you for purchasing credits at ClearCut AI. We appreciate your business.</p>
          <p>All purchases of credit packs are final and non-refundable. Once credits are purchased and added to your account, they cannot be refunded or exchanged for cash.</p>
          <p>The credits you purchase do not expire and can be used for any premium feature available on our platform.</p>

          <h2>Exceptional Circumstances</h2>
          <p>In the rare event of a technical error resulting in a failed transaction where you were charged but credits were not added to your account, please contact our support team with your transaction details. We will investigate the issue and, if a processing error is confirmed on our end, we will ensure the purchased credits are correctly allocated to your account.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about our Refunds Policy, please contact us through our contact page.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Refunds;