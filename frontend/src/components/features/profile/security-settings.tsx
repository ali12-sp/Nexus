"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, API_DOCS_URL, API_ORIGIN, ApiError } from "@/lib/api";
import type { AuditLogItem, User } from "@/lib/types";

type OtpResponse = {
  deliveredTo: string;
  expiresAt: string;
  fallbackCodePreview?: string;
};

type EmailVerificationResponse = {
  deliveredTo: string;
  expiresAt?: string;
  alreadyVerified?: boolean;
  previewToken?: string;
  previewUrl?: string;
  verifiedAt?: string;
};

type PasswordResetPreviewResponse = {
  accepted: boolean;
  deliveredTo: string;
  expiresAt?: string;
  previewToken?: string;
  previewUrl?: string;
};

const HEALTH_URL = `${API_ORIGIN}/api/health`;
const READY_URL = `${API_ORIGIN}/api/ready`;
const METRICS_URL = `${API_ORIGIN}/api/metrics/runtime`;

const actionLabels: Record<string, string> = {
  AUTH_LOGIN: "Signed in",
  AUTH_REFRESH: "Session refreshed",
  AUTH_REGISTER: "Account created",
  AUTH_REQUEST_EMAIL_VERIFICATION: "Verification link issued",
  AUTH_VERIFY_EMAIL: "Email verified",
  AUTH_REQUEST_PASSWORD_RESET: "Password reset requested",
  AUTH_RESET_PASSWORD: "Password reset completed",
  AUTH_SEND_OTP: "OTP issued",
  AUTH_VERIFY_OTP: "OTP verified",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const SecuritySettings = () => {
  const { user, token, refreshSession, setUser } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpPreview, setOtpPreview] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<{
    label: string;
    token?: string | null;
    url?: string | null;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user]);

  const loadAuditLogs = async () => {
    if (!token) {
      return;
    }

    setIsAuditLoading(true);

    try {
      const result = await apiFetch<AuditLogItem[]>("/auth/audit-logs?limit=10", {
        token,
      });
      setAuditLogs(result);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditLogs();
  }, [token]);

  const clearTransientFeedback = () => {
    setError(null);
    setMessage(null);
    setLinkPreview(null);
  };

  const saveTwoFactorPreference = async () => {
    if (!token || !user) {
      return;
    }

    setIsBusy(true);
    clearTransientFeedback();

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
      await loadAuditLogs();
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

  const requestEmailVerificationLink = async () => {
    if (!token) {
      return;
    }

    setIsBusy(true);
    clearTransientFeedback();

    try {
      const result = await apiFetch<EmailVerificationResponse>("/auth/request-email-verification", {
        method: "POST",
        token,
      });

      if (result.alreadyVerified) {
        setMessage("This email is already verified.");
      } else {
        setMessage(`Verification link prepared for ${result.deliveredTo}.`);
      }

      setLinkPreview({
        label: "Verification link",
        token: result.previewToken ?? null,
        url: result.previewUrl ?? null,
      });
      await loadAuditLogs();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to issue a verification link right now.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const requestPasswordResetLink = async () => {
    if (!user) {
      return;
    }

    setIsBusy(true);
    clearTransientFeedback();

    try {
      const result = await apiFetch<PasswordResetPreviewResponse>("/auth/request-password-reset", {
        method: "POST",
        body: {
          email: user.email,
        },
      });

      setMessage(`Recovery flow prepared for ${result.deliveredTo}.`);
      setLinkPreview({
        label: "Password reset link",
        token: result.previewToken ?? null,
        url: result.previewUrl ?? null,
      });
      await loadAuditLogs();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to prepare password recovery right now.",
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
    clearTransientFeedback();

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
      await loadAuditLogs();
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
    clearTransientFeedback();

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
      await loadAuditLogs();
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
      description="Control authentication posture, verify account ownership, rehearse recovery flows, and inspect operational health like a production team would."
      title="Security & Operations"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card
            description="Use email verification, short-lived access sessions, and OTP to harden how this workspace is accessed."
            title="Identity controls"
          >
            <div className="space-y-6">
              <div className="rounded-[24px] bg-sand/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">Email verification</p>
                    <p className="mt-1 text-sm text-slate">
                      Verified email is used for recovery and future security notifications.
                    </p>
                  </div>
                  <Badge tone={user?.emailVerifiedAt ? "success" : "warning"}>
                    {user?.emailVerifiedAt ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button disabled={isBusy} onClick={() => void requestEmailVerificationLink()} type="button" variant="outline">
                    Send verification link
                  </Button>
                  {user?.emailVerifiedAt ? (
                    <p className="self-center text-sm text-slate">
                      Verified on {formatDateTime(user.emailVerifiedAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">Two-factor authentication</p>
                    <p className="mt-1 text-sm text-slate">
                      Keep OTP support enabled for login-grade flows and sensitive actions.
                    </p>
                  </div>
                  <Badge tone={twoFactorEnabled ? "success" : "warning"}>
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={() => setTwoFactorEnabled((current) => !current)} type="button" variant="outline">
                    Toggle setting
                  </Button>
                  <Button disabled={isBusy} onClick={() => void saveTwoFactorPreference()} type="button">
                    Save security setting
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card
            description="Exercise the recovery flows a real product needs: OTP, password reset, and secure handoff links."
            title="Recovery workflows"
          >
            <div className="space-y-6">
              <div className="rounded-[24px] bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-mint/10 p-3 text-mint">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-ink">OTP test flow</p>
                    <p className="text-sm text-slate">
                      Send a mock OTP to the current account email and verify it here.
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

              <div className="rounded-[24px] bg-sand/70 p-5">
                <p className="font-semibold text-ink">Password reset</p>
                <p className="mt-1 text-sm text-slate">
                  Generate a secure password reset workflow for the current account or test the standalone recovery screen.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button disabled={isBusy} onClick={() => void requestPasswordResetLink()} type="button" variant="outline">
                    Send reset link
                  </Button>
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-full bg-transparent px-5 text-sm font-semibold text-slate transition hover:bg-slate-100"
                    href="/reset-password"
                  >
                    Open reset workspace
                  </Link>
                </div>
              </div>

              {linkPreview ? (
                <div className="rounded-[24px] bg-mint/5 p-5">
                  <p className="font-semibold text-ink">{linkPreview.label}</p>
                  <p className="mt-1 text-sm text-slate">
                    Development environments expose the secure link for local QA without real email delivery.
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    {linkPreview.url ? (
                      <Link className="font-semibold text-mint hover:underline" href={linkPreview.url}>
                        Open secure link
                      </Link>
                    ) : null}
                    {linkPreview.token ? (
                      <p className="break-all rounded-2xl bg-white px-4 py-3 text-ink">
                        Token: <strong>{linkPreview.token}</strong>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            description="Recent security-sensitive actions are captured for traceability and debugging."
            title="Audit trail"
          >
            <div className="space-y-4">
              {isAuditLoading ? <p className="text-sm text-slate">Loading activity...</p> : null}
              {!isAuditLoading && auditLogs.length === 0 ? (
                <p className="text-sm text-slate">No audit activity is available yet.</p>
              ) : null}
              {auditLogs.map((entry) => (
                <div className="rounded-[24px] bg-sand/70 p-4" key={entry.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-ink">
                      {actionLabels[entry.action] ?? entry.action}
                    </p>
                    <Badge tone={entry.status === "SUCCESS" ? "success" : "danger"}>
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate">
                    {entry.entityType} | {formatDateTime(entry.createdAt)}
                  </p>
                  {entry.ipAddress ? (
                    <p className="mt-2 text-xs text-slate">IP: {entry.ipAddress}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card
            description="Quick links for backend verification, runtime checks, and deployment handoff."
            title="Project operations"
          >
            <div className="space-y-5">
              <div className="rounded-[24px] bg-sand/70 p-5">
                <p className="font-semibold text-ink">Operational endpoints</p>
                <p className="mt-1 text-sm text-slate">
                  Health, readiness, runtime metrics, and Swagger are available for deployment smoke tests.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="text-sm font-semibold text-mint hover:underline" href={API_DOCS_URL} target="_blank">
                    Swagger docs
                  </Link>
                  <Link className="text-sm font-semibold text-mint hover:underline" href={HEALTH_URL} target="_blank">
                    Health
                  </Link>
                  <Link className="text-sm font-semibold text-mint hover:underline" href={READY_URL} target="_blank">
                    Readiness
                  </Link>
                  <Link className="text-sm font-semibold text-mint hover:underline" href={METRICS_URL} target="_blank">
                    Runtime metrics
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 text-mint" size={18} />
                  <div>
                    <p className="font-semibold text-ink">Current workspace notes</p>
                    <p className="mt-1 text-sm text-slate">
                      The platform now includes rotating browser sessions, recovery links, email verification, audit logs, Dockerized startup, CI verification, and runtime telemetry alongside the original collaboration workflows.
                    </p>
                  </div>
                </div>
              </div>

              {message ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {message}
                </p>
              ) : null}
              {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
