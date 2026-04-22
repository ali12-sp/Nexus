import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  }
>;

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  accent: "bg-mint/10 text-mint",
};

export const Badge = ({ children, className, tone = "neutral", ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
