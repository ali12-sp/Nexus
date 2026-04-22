import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string | null;
};

export const Input = ({ label, hint, error, className, ...props }: InputProps) => (
  <label className="block space-y-2">
    {label ? (
      <span className="text-sm font-medium text-ink">
        {label}
      </span>
    ) : null}
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-mint focus:ring-4 focus:ring-mint/10",
        error && "border-ember focus:border-ember focus:ring-ember/10",
        className,
      )}
      {...props}
    />
    {error ? <span className="text-xs text-ember">{error}</span> : null}
    {!error && hint ? <span className="text-xs text-slate">{hint}</span> : null}
  </label>
);
