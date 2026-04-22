"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, API_DOCS_URL, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type OtpResponse = {
  deliveredTo: string;
  expiresAt: string;
  fallbackCodePreview?: string;
};

export const SecuritySettings = () => {
  const { user, token, refreshSession, setUser } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user]);

  const saveTwoFactorPreference = async () => {
    if (!token || !user) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await apiFetch<User>("/users/me", {
        method: "PUT",
        token,
        body: {
          twoFactorEnabled,
        },
      });

      setUser(updatedUser);
      await refreshSession();
      setMessage("Security preference saved.");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to save your security settings.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!user) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiFetch<OtpResponse>("/auth/send-otp", {
        method: "POST",
        body: {
          email: user.email,
          purpose: "LOGIN",
        },
      });

      setOtpPreview(result.fallbackCodePreview ?? null);
      setMessage(`OTP sent to ${result.deliveredTo}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : "Unable to send OTP.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!user) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: {
          email: user.email,
          code: otpCode,
          purpose: "LOGIN",
        },
      });

      setMessage("OTP verified successfully.");
      setOtpCode("");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : "Unable to verify OTP.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AppShell
      description="Control security posture, test the mock OTP flow, and inspect the live API documentation for deployment handoff."
      title="Settings"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card description="Mock 2FA can be toggled on the user profile for MVP verification flows." title="Security controls">
          <div className="space-y-6">
            <div className="rounded-[24px] bg-sand/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">Two-factor authentication</p>
                  <p className="mt-1 text-sm text-slate">
                    Enable OTP verification support for login-grade flows.
                  </p>
                </div>
                <Badge tone={twoFactorEnabled ? "success" : "warning"}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => setTwoFactorEnabled((current) => !current)}
                  type="button"
                  variant="outline"
                >
                  Toggle setting
                </Button>
                <Button disabled={isBusy} onClick={() => void saveTwoFactorPreference()} type="button">
                  Save security setting
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-mint/10 p-3 text-mint">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-ink">OTP test flow</p>
                  <p className="text-sm text-slate">
                    Send a mock OTP to the current user email and verify it from this screen.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Button disabled={isBusy} onClick={() => void sendOtp()} type="button" variant="secondary">
                  Send OTP
                </Button>
                <Input
                  label="Verification code"
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder="Enter the 6 digit code"
                  value={otpCode}
                />
                <Button disabled={isBusy || otpCode.length !== 6} onClick={() => void verifyOtp()} type="button">
                  Verify OTP
                </Button>
                {otpPreview ? (
                  <div className="rounded-2xl bg-mint/10 px-4 py-3 text-sm text-mint">
                    Development preview code: <strong>{otpPreview}</strong>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card description="Quick links for backend verification and deployment handoff." title="Project operations">
          <div className="space-y-5">
            <div className="rounded-[24px] bg-sand/70 p-5">
              <p className="font-semibold text-ink">API documentation</p>
              <p className="mt-1 text-sm text-slate">
                Swagger is mounted on the Express backend for validation and QA.
              </p>
              <Link
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-ink transition hover:border-mint/30 hover:bg-mint/5"
                href={API_DOCS_URL}
                target="_blank"
              >
                Open Swagger docs
              </Link>
            </div>

            <div className="rounded-[24px] bg-white p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 text-mint" size={18} />
                <div>
                  <p className="font-semibold text-ink">Current workspace notes</p>
                  <p className="mt-1 text-sm text-slate">
                    Backend APIs, Prisma schema, Socket.IO signaling, and local document storage are ready for frontend integration. Stripe and PayPal remain sandbox-only by design.
                  </p>
                </div>
              </div>
            </div>

            {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
