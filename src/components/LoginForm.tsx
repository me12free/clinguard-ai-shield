import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordField } from "@/components/auth/PasswordField";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        notifySuccess("Welcome back", "You are signed in.");
        navigate("/dashboard", { replace: true });
      } else {
        throw new Error("No token received");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      notifyError("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 lg:hidden mb-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">Sign in</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          <span className="lg:hidden">
            Access your workspace. PHI is detected and redacted before the AI sees your message.
          </span>
          <span className="hidden lg:inline">Enter your credentials to continue.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-destructive/40">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Could not sign in</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
          </div>
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/30 pt-6 pb-6">
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline underline-offset-4">
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
