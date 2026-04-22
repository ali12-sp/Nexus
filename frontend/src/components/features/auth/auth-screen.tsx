import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type AuthScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const AuthScreen = ({
  eyebrow,
  title,
  description,
  children,
}: AuthScreenProps) => (
  <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative overflow-hidden rounded-[40px] border border-white/70 bg-ink px-8 py-10 text-white shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.45),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.35),transparent_28%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
          <div className="space-y-5">
            <Badge className="bg-white/10 text-white" tone="neutral">
              Nexus Platform
            </Badge>
            <div className="max-w-xl space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">{eyebrow}</p>
              <h1 className="font-display text-5xl leading-tight">
                Build conviction before the next call.
              </h1>
              <p className="max-w-lg text-base text-white/70">
                Nexus brings investor-founder workflows into one secure room with role-aware dashboards, meeting scheduling, diligence files, signatures, and transaction simulation.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Secure workspaces</p>
              <p className="mt-2 font-display text-3xl">7</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Active rooms</p>
              <p className="mt-2 font-display text-3xl">12</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Document versions</p>
              <p className="mt-2 font-display text-3xl">46</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center rounded-[40px] border border-white/70 bg-white/88 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-mint">{eyebrow}</p>
            <h2 className="font-display text-4xl text-ink">{title}</h2>
            <p className="text-sm text-slate">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  </div>
);
