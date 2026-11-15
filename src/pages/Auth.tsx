import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, signUpSchema } from "@/lib/inputValidation";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";

const Auth = () => {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const redirectTo = () => {
    const from = (location.state as { from?: { pathname?: unknown } } | null)?.from?.pathname;
    return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/";
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schema = mode === "sign-up" ? signUpSchema : signInSchema;
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          setMode("sign-in");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      navigate(redirectTo(), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  const signInWith = async (provider: "google" | "lovable") => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate(redirectTo(), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start sign-in.");
      setBusy(false);
    }
  };

  if (user) {
    navigate(redirectTo(), { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <section className="mx-auto w-full max-w-md border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">Smart Chief</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save favorite recipes and keep your meal plans private.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "sign-up" && (
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-up" ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
            {mode === "sign-up" && <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>}
          </div>
          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void signInWith("google")}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" className="mr-2 shrink-0">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            Continue with Google
          </Button>
          <Button type="button" className="lovable-auth-button w-full" disabled={busy} onClick={() => void signInWith("lovable")}>
            Continue with Lovable
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
          <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
};

export default Auth;