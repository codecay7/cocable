import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 prose dark:prose-invert">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>Your privacy is important to us. It is ClearCut AI's policy to respect your privacy regarding any information we may collect from you across our website.</p>
          
          <h2>1. Information We Collect</h2>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
          <p>The only personal information we collect is your email address when you sign up for an account. This is used for authentication and communication purposes.</p>

          <h2>2. Image Processing</h2>
          <p>All image processing is performed directly in your web browser. Your images are never uploaded to, stored on, or transmitted to our servers. We have no access to the images you process using our tools.</p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Provide, operate, and maintain our services.</li>
            <li>Communicate with you, including for customer service and to provide you with updates and other information relating to the website.</li>
          </ul>

          <h2>4. Security</h2>
          <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.</p>

          <h2>5. Links to Other Sites</h2>
          <p>Our Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>

          <h2>6. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately after they are posted on this page.</p>

          <h2>7. Contact Us</h2>
          <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;