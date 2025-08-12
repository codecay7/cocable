import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail } from 'lucide-react';

const Contact = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Contact Us</CardTitle>
          <CardDescription>We'd love to hear from you! Whether you have a question, feedback, or need assistance, feel free to reach out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4 p-4 border rounded-lg">
            <Mail className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <a href="mailto:cocableai@gmail.com" className="text-primary hover:underline">
                cocableai@gmail.com
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">We typically respond within 24-48 hours on business days.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contact;