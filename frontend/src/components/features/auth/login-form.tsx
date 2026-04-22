"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthScreen } from "@/components/features/auth/auth-screen";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

export const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("sarah.investor@nexus.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await login({ email, password });
      router.replace(
        user.role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/entrepreneur",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : "Unable to sign in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      eyebrow="Secure Access"
      title="Sign in to your Nexus workspace"
      description="Use seeded demo credentials or your registered account to access the full collaboration suite."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="founder@nexus.local"
          type="email"
          value={email}
        />
        <Input
          autoComplete="current-password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          type="password"
          value={password}
        />

        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}

        <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <Card className="bg-sand/70" title="Demo accounts">
        <div className="space-y-4 text-sm text-slate">
          <div>
            <p className="font-semibold text-ink">Investor</p>
            <p>`sarah.investor@nexus.local`</p>
            <p>`Password123!`</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Entrepreneur</p>
            <p>`ali.founder@nexus.local`</p>
            <p>`Password123!`</p>
          </div>
        </div>
      </Card>

      <p className="text-sm text-slate">
        New to Nexus?{" "}
        <Link className="font-semibold text-mint hover:underline" href="/register">
          Create an account
        </Link>
      </p>
    </AuthScreen>
  );
};
