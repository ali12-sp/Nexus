import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
    action?: ReactNode;
  }
>;

export const Card = ({
  title,
  description,
  action,
  className,
  children,
  ...props
}: CardProps) => (
  <section
    className={cn(
      "rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur",
      className,
    )}
    {...props}
  >
    {(title || description || action) && (
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? <h2 className="font-display text-xl text-ink">{title}</h2> : null}
          {description ? <p className="max-w-2xl text-sm text-slate">{description}</p> : null}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);
