import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";
import { useLocation } from "wouter";

export function AuthForm() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login with:", email, password);
    setLocation("/dashboard");
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    setLocation("/dashboard");
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
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
                <div className="text-right">
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <Button type="submit" className="w-full" data-testid="button-login">
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john.doe@example.com"
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    data-testid="input-signup-password"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-signup">
                  Sign Up
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
              onClick={() => handleSocialLogin("Google")}
              data-testid="button-google-login"
            >
              <SiGoogle className="h-4 w-4" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleSocialLogin("GitHub")}
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
