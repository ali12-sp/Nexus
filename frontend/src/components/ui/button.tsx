import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
  }
>;

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-mint text-white shadow-soft hover:bg-emerald-800 focus-visible:outline-mint/60",
  secondary:
    "bg-gold text-white shadow-soft hover:bg-amber-700 focus-visible:outline-gold/60",
  outline:
    "border border-slate-200 bg-white text-ink hover:border-mint/30 hover:bg-mint/5 focus-visible:outline-mint/40",
  ghost:
    "bg-transparent text-slate hover:bg-slate-100 focus-visible:outline-slate/40",
  danger:
    "bg-ember text-white shadow-soft hover:bg-red-800 focus-visible:outline-ember/50",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = ({
  children,
  className,
  fullWidth,
  size = "md",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full",
      className,
    )}
    type={type}
    {...props}
  >
    {children}
  </button>
);
