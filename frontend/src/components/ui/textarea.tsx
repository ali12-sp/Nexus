import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string | null;
};

export const Textarea = ({
  label,
  hint,
  error,
  className,
  ...props
}: TextareaProps) => (
  <label className="block space-y-2">
    {label ? <span className="text-sm font-medium text-ink">{label}</span> : null}
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-mint focus:ring-4 focus:ring-mint/10",
        error && "border-ember focus:border-ember focus:ring-ember/10",
        className,
      )}
      {...props}
    />
    {error ? <span className="text-xs text-ember">{error}</span> : null}
    {!error && hint ? <span className="text-xs text-slate">{hint}</span> : null}
  </label>
);
