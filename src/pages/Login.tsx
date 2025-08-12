import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { Navigate, Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

const Login = () => {
  const { session } = useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="relative hidden items-center justify-center bg-muted lg:flex">
        <div className="absolute inset-0 bg-dot-pattern" />
        <div className="relative z-10 text-center p-8">
          <Link to="/" className="flex items-center justify-center space-x-3 mb-4">
            <Scissors className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">ClearCut AI</span>
          </Link>
          <h1 className="text-4xl font-bold mt-4">Unlock Your Creativity</h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Join thousands of creators simplifying their workflow with AI.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <p className="text-balance text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              className: {
                container: 'space-y-4',
                button: 'inline-flex items-center justify-center w-full rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2',
                input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                label: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                anchor: 'text-sm text-primary hover:text-primary/90 underline underline-offset-4',
                divider: 'text-sm text-muted-foreground',
                message: 'mt-2 text-sm p-3 rounded-md border bg-muted text-muted-foreground [&[data-type=error]]:bg-destructive [&[data-type=error]]:text-destructive-foreground [&[data-type=error]]:border-destructive',
              },
            }}
            providers={[]}
            theme="dark"
            view="sign_in"
          />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;