import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

interface ComingSoonProps {
  pageTitle: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ pageTitle }) => {
  return (
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <Card className="max-w-lg mx-auto text-center bg-card/50 backdrop-blur-xl border-white/20">
        <CardHeader>
          <Construction className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-bold mt-4">Coming Soon!</CardTitle>
          <CardDescription>
            The "{pageTitle}" tool is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};