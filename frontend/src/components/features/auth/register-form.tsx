"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthScreen } from "@/components/features/auth/auth-screen";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/lib/types";

export const RegisterForm = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ENTREPRENEUR");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const user = await register({
        fullName,
        email,
        password,
        role,
      });

      router.replace(
        user.role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/entrepreneur",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to create your account right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      eyebrow="Account Setup"
      title="Create your Nexus account"
      description="Choose your role now. You'll land in a dashboard tailored to your investor or founder workflow."
    >
      <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <Input
            label="Full name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your name"
            value={fullName}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@nexus.local"
            type="email"
            value={email}
          />
        </div>
        <Select
          label="Role"
          onChange={(event) => setRole(event.target.value as UserRole)}
          value={role}
        >
          <option value="ENTREPRENEUR">Entrepreneur</option>
          <option value="INVESTOR">Investor</option>
        </Select>
        <Input
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          type="password"
          value={password}
        />
        <div className="sm:col-span-2">
          <Input
            label="Confirm password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            type="password"
            value={confirmPassword}
          />
        </div>

        {error ? (
          <p className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">
            {error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>

      <p className="text-sm text-slate">
        Already have an account?{" "}
        <Link className="font-semibold text-mint hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
};
