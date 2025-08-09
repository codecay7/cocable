import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 prose dark:prose-invert">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>Please read these terms and conditions carefully before using Our Service.</p>

          <h2>1. Acknowledgment</h2>
          <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and ClearCut AI. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
          <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>

          <h2>2. User Accounts</h2>
          <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
          <p>You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password.</p>

          <h2>3. Intellectual Property</h2>
          <p>The Service and its original content (excluding Content provided by You or other users), features and functionality are and will remain the exclusive property of ClearCut AI and its licensors. You retain full ownership of the images you upload and process. We claim no intellectual property rights over the material you provide to the Service.</p>

          <h2>4. Termination</h2>
          <p>We may terminate or suspend Your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>

          <h2>5. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, in no event shall ClearCut AI or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service).</p>

          <h2>6. Governing Law</h2>
          <p>The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.</p>

          <h2>7. Changes to These Terms and Conditions</h2>
          <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;