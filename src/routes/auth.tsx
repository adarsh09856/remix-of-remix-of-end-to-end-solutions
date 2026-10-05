import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Sign in — Takin Mart" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session?.user) return;
      if (mounted) navigate({ to: redirect ?? "/account", replace: true });
    });
    return () => {
      mounted = false;
    };
  }, [navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Please sign in to continue.");
          setMode("signin");
          return;
        }
        toast.success("Account created — you're signed in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: redirect ?? "/account", replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }


  const input = "w-full bg-card border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary";

  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <h1 className="font-display text-4xl text-center">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {mode === "signin" ? "Sign in to checkout, manage orders, and update your profile." : "Join the Takin Mart family."}
      </p>


      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && (
          <input className={input} placeholder="Full name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading} className="btn-hero w-full">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New to Takin Mart?" : "Already have an account?"}{" "}
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium hover:underline">
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
