"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthScreen } from "@/components/features/auth/auth-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";

type PasswordResetRequestResponse = {
  accepted: boolean;
  deliveredTo: string;
  expiresAt?: string;
  previewToken?: string;
  previewUrl?: string;
};

type PasswordResetCompleteResponse = {
  reset: boolean;
};

export const ResetPasswordWorkspace = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasToken = useMemo(() => Boolean(token), [token]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiFetch<PasswordResetRequestResponse>("/auth/request-password-reset", {
        method: "POST",
        body: { email },
      });

      setPreviewUrl(result.previewUrl ?? null);
      setPreviewToken(result.previewToken ?? null);
      setMessage(
        `If ${result.deliveredTo} belongs to a Nexus account, a password reset workflow is now available.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to start password recovery right now.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("A reset token is required.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch<PasswordResetCompleteResponse>("/auth/reset-password", {
        method: "POST",
        body: {
          token,
          password,
        },
      });

      setMessage("Password reset completed. You can sign in with your new password now.");
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to reset your password right now.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AuthScreen
      eyebrow="Account Recovery"
      title={hasToken ? "Choose a new password" : "Recover your workspace access"}
      description={
        hasToken
          ? "Set a new password for your Nexus account using the secure reset token."
          : "Start a password reset flow and use the secure link delivered to your email."
      }
    >
      {hasToken ? (
        <form className="space-y-5" onSubmit={submitNewPassword}>
          <Input
            autoComplete="new-password"
            label="New password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            type="password"
            value={password}
          />
          <Input
            autoComplete="new-password"
            label="Confirm password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            type="password"
            value={confirmPassword}
          />

          {message ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p>
          ) : null}

          <Button disabled={isBusy} fullWidth size="lg" type="submit">
            {isBusy ? "Updating password..." : "Save new password"}
          </Button>
        </form>
      ) : (
        <>
          <form className="space-y-5" onSubmit={requestReset}>
            <Input
              autoComplete="email"
              label="Account email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="founder@nexus.local"
              type="email"
              value={email}
            />

            {message ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p>
            ) : null}

            <Button disabled={isBusy} fullWidth size="lg" type="submit">
              {isBusy ? "Preparing reset..." : "Send reset link"}
            </Button>
          </form>

          {previewUrl || previewToken ? (
            <Card className="bg-sand/70" title="Development preview">
              <div className="space-y-3 text-sm text-slate">
                <p>
                  Local environments expose a preview reset link so the recovery flow can be tested without SMTP.
                </p>
                {previewUrl ? (
                  <Link className="font-semibold text-mint hover:underline" href={previewUrl}>
                    Open reset link
                  </Link>
                ) : null}
                {previewToken ? (
                  <p className="break-all rounded-2xl bg-white px-4 py-3 text-ink">
                    Token: <strong>{previewToken}</strong>
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}
        </>
      )}

      <p className="text-sm text-slate">
        Ready to go back?{" "}
        <Link className="font-semibold text-mint hover:underline" href="/login">
          Return to sign in
        </Link>
      </p>
    </AuthScreen>
  );
};
