import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SiGoogle, SiGithub } from 'react-icons/si';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export function AuthForm() {
  const [, setLocation] = useLocation();

  // Login state (login by username per server routes)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // Basic validators
  const isValidUsername = (v: string) => v.trim().length >= 3;
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const isValidPassword = (v: string) => v.length >= 8;

  // Login handler: uses server GET /api/users/username/:username
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!isValidUsername(loginUsername)) {
      setLoginError('Enter a valid username (min 3 characters).');
      return;
    }

    setLoginLoading(true);
    try {
      // server route: [server/routes.ts] handles GET /api/users/username/:username
      // symbol: [`storage.createUser`](server/routes.ts) is used by signup route
      const url = `/api/users/username/${encodeURIComponent(loginUsername.trim())}`;
      const res = await apiRequest('GET', url);
      const user = await res.json();

      // If user found, treat as "logged in" (this app uses simple sessionless flow).
      // In a real app you'd verify password and create a server session / JWT.
      console.log('Logged in:', user);
      // store minimal session in localStorage for client navigation
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({ title: 'Logged in', description: `Welcome back ${user.username || 'user'}` });
      setLocation('/dashboard');
    } catch (err: any) {
      const message = err?.message || 'Login failed. User not found or server error.';
      setLoginError(message);
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setLoginLoading(false);
    }
  };

  // Signup handler: uses server POST /api/users (expects { username, email })
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!isValidUsername(signupUsername)) {
      setSignupError('Username must be at least 3 characters.');
      return;
    }
    if (!isValidEmail(signupEmail)) {
      setSignupError('Enter a valid email address.');
      return;
    }
    if (!isValidPassword(signupPassword)) {
      setSignupError('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      // Server route: POST /api/users -> [server/routes.ts]
      const res = await apiRequest('POST', '/api/users', {
        username: signupUsername.trim(),
        email: signupEmail.trim(),
      });
      const created = await res.json();
      console.log('User created:', created);
      localStorage.setItem('currentUser', JSON.stringify(created));
      toast({ title: 'Sign up successful', description: `Welcome ${created.username || 'user'}` });
      setLocation('/dashboard');
    } catch (err: any) {
      const message = err?.message || 'Signup failed. Server error.';
      setSignupError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Log in to continue your code review journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="your-username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-login-password"
                  />
                </div>

                {loginError && <div className="text-sm text-destructive">{loginError}</div>}

                <div className="text-right">
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-login"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    placeholder="choose-a-username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    data-testid="input-signup-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    data-testid="input-signup-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    data-testid="input-signup-confirm"
                  />
                </div>

                {signupError && <div className="text-sm text-destructive">{signupError}</div>}

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-signup"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                // Social buttons are stubs for now
                console.log('Social login clicked: Google');
                setLocation('/dashboard');
              }}
              data-testid="button-google-login"
            >
              <SiGoogle className="h-4 w-4" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                console.log('Social login clicked: GitHub');
                setLocation('/dashboard');
              }}
              data-testid="button-github-login"
            >
              <SiGithub className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
