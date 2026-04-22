"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Video,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-medium text-slate shadow-soft">
      Loading Nexus workspace...
    </div>
  </div>
);

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export const AppShell = ({ title, description, children, actions }: AppShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  const dashboardHref =
    user.role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/entrepreneur";

  const navItems = [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/meetings", label: "Meetings", icon: CalendarDays },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/video", label: "Video Room", icon: Video },
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:items-start">
        <aside className="hidden w-80 shrink-0 flex-col rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur lg:flex">
          <div className="space-y-3">
            <Badge tone="accent">Nexus Workspace</Badge>
            <div>
              <p className="font-display text-2xl text-ink">Investor and founder ops, in one room.</p>
              <p className="mt-2 text-sm text-slate">
                Secure meetings, shared documents, e-signatures, and mock payment flows from one role-aware dashboard.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] bg-sand/80 p-5">
            <p className="text-sm text-slate">Signed in as</p>
            <p className="mt-1 font-display text-xl text-ink">{user.fullName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{user.role}</Badge>
              {user.startupName ? <Badge>{user.startupName}</Badge> : null}
              {user.firmName ? <Badge>{user.firmName}</Badge> : null}
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-mint text-white shadow-soft"
                      : "text-slate hover:bg-slate-100 hover:text-ink",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <Button
              className="justify-start"
              fullWidth
              variant="ghost"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="mr-2" size={16} />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <Badge tone="neutral">{user.email}</Badge>
                <div>
                  <h1 className="font-display text-3xl text-ink">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate">{description}</p>
                </div>
              </div>
              {actions}
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};
