import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scissors } from 'lucide-react';

const Login = () => {
  const { session } = useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-100 to-rose-100 dark:from-slate-900 dark:to-rose-950">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <Scissors className="h-10 w-10 mx-auto text-primary" />
          <CardTitle className="text-2xl font-bold mt-4">Welcome to Cocable AI</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="dark"
            socialLayout="horizontal"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;