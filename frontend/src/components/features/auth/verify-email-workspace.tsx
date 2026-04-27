"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthScreen } from "@/components/features/auth/auth-screen";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import type { User } from "@/lib/types";

type VerifyEmailResponse = {
  verified: boolean;
  user: User;
};

export const VerifyEmailWorkspace = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setUser } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "loading" : "idle",
  );
  const [message, setMessage] = useState(
    token ? "Verifying your email now..." : "A verification token is required.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        const result = await apiFetch<VerifyEmailResponse>("/auth/verify-email", {
          method: "POST",
          body: { token },
        });

        setUser(result.user);
        setStatus("success");
        setMessage("Your email is verified. Recovery and security workflows are fully enabled.");
      } catch (caughtError) {
        setStatus("error");
        setMessage(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Unable to verify your email right now.",
        );
      }
    };

    void verify();
  }, [setUser, token]);

  return (
    <AuthScreen
      eyebrow="Email Verification"
      title="Confirm your Nexus identity"
      description="Verification links are single-use and help protect password recovery, alerts, and collaboration security flows."
    >
      <div className="space-y-5">
        <div
          className={`rounded-[24px] px-5 py-4 text-sm ${
            status === "success"
              ? "bg-emerald-50 text-emerald-800"
              : status === "error"
                ? "bg-red-50 text-ember"
                : "bg-sand/70 text-slate"
          }`}
        >
          {message}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-mint px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-800"
            href="/login"
          >
            Go to sign in
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-ink transition hover:border-mint/30 hover:bg-mint/5"
            href="/settings"
          >
            Open security settings
          </Link>
        </div>
      </div>
    </AuthScreen>
  );
};
