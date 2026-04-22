import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string | null;
};

export const Select = ({ label, hint, error, className, children, ...props }: SelectProps) => (
  <label className="block space-y-2">
    {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
    <select
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-mint focus:ring-4 focus:ring-mint/10",
        error && "border-ember focus:border-ember focus:ring-ember/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error ? <span className="text-xs text-ember">{error}</span> : null}
    {!error && hint ? <span className="text-xs text-slate">{hint}</span> : null}
  </label>
);
