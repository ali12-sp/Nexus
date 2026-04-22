"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CreditCard,
  HandCoins,
  RefreshCcw,
  Video,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError } from "@/lib/api";
import type { DashboardSummary, MeetingStatus, TransactionStatus, UserRole } from "@/lib/types";
import { formatCurrency, formatDateTime, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const meetingToneMap: Record<MeetingStatus, "accent" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  COMPLETED: "accent",
};

const transactionToneMap: Record<TransactionStatus, "neutral" | "success" | "danger"> = {
  PENDING: "neutral",
  COMPLETED: "success",
  FAILED: "danger",
};

export const DashboardOverview = ({ expectedRole }: { expectedRole: UserRole }) => {
  const router = useRouter();
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = async () => {
    if (!token || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFetch<DashboardSummary>("/dashboard", { token });
      startTransition(() => setSummary(result));
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load the dashboard right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role !== expectedRole) {
      router.replace(
        user.role === "INVESTOR" ? "/dashboard/investor" : "/dashboard/entrepreneur",
      );
      return;
    }

    void loadSummary();
  }, [expectedRole, router, token, user]);

  return (
    <AppShell
      actions={
        <Button onClick={() => void loadSummary()} variant="outline">
          <RefreshCcw className="mr-2" size={16} />
          Refresh
        </Button>
      }
      description={
        expectedRole === "INVESTOR"
          ? "Track founder pipeline, diligence calls, shared documents, and sandbox transaction flow from one investor command center."
          : "Coordinate investors, meetings, diligence files, and funding operations from a founder-focused workspace."
      }
      title={expectedRole === "INVESTOR" ? "Investor dashboard" : "Entrepreneur dashboard"}
    >
      {error ? (
        <Card className="border-red-200 bg-red-50/80">
          <p className="text-sm text-ember">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Wallet balance">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-mint/10 p-3 text-mint">
              <HandCoins size={22} />
            </div>
            <div>
              <p className="font-display text-3xl text-ink">
                {summary ? formatCurrency(summary.stats.walletBalance) : "--"}
              </p>
              <p className="text-sm text-slate">Sandbox wallet for demos</p>
            </div>
          </div>
        </Card>
        <Card title="Upcoming meetings">
          <p className="font-display text-3xl text-ink">
            {summary ? summary.stats.upcomingMeetingCount : "--"}
          </p>
          <p className="text-sm text-slate">Conflict-aware scheduling enabled</p>
        </Card>
        <Card title="Document chamber">
          <p className="font-display text-3xl text-ink">
            {summary ? summary.stats.documentCount : "--"}
          </p>
          <p className="text-sm text-slate">Recent diligence files and versions</p>
        </Card>
        <Card title="Recent transactions">
          <p className="font-display text-3xl text-ink">
            {summary ? summary.stats.recentTransactionCount : "--"}
          </p>
          <p className="text-sm text-slate">Latest payment activity</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          action={
            <Button onClick={() => router.push("/meetings")} variant="ghost">
              Open meetings
            </Button>
          }
          description="Your next collaboration checkpoints"
          title="Upcoming calls"
        >
          {isLoading ? (
            <p className="text-sm text-slate">Loading meeting activity...</p>
          ) : summary?.upcomingMeetings.length ? (
            <div className="space-y-4">
              {summary.upcomingMeetings.map((meeting) => (
                <div
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-sand/70 p-4 lg:flex-row lg:items-center lg:justify-between"
                  key={meeting.id}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{meeting.title}</p>
                      <Badge tone={meetingToneMap[meeting.status]}>{meeting.status}</Badge>
                    </div>
                    <p className="text-sm text-slate">{formatDateTime(meeting.startTime)}</p>
                    <p className="text-sm text-slate">
                      With{" "}
                      {meeting.organizerId === user?.id
                        ? meeting.invitee?.fullName ?? "Guest"
                        : meeting.organizer?.fullName ?? "Host"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => router.push("/meetings")} variant="outline">
                      Details
                    </Button>
                    {meeting.status === "ACCEPTED" ? (
                      <Button
                        onClick={() =>
                          router.push(`/video?meetingId=${meeting.id}&roomId=${meeting.roomId}`)
                        }
                      >
                        <Video className="mr-2" size={16} />
                        Join room
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">No meetings scheduled yet.</p>
          )}
        </Card>

        <Card
          action={
            <Button onClick={() => router.push("/settings")} variant="ghost">
              Review settings
            </Button>
          }
          description="Recent security, document, and payment activity"
          title="Notifications"
        >
          <div className="space-y-4">
            {summary?.notifications.length ? (
              summary.notifications.map((item) => (
                <div className="flex gap-3 rounded-[24px] border border-slate-100 bg-white p-4" key={item.id}>
                  <div className="rounded-2xl bg-mint/10 p-3 text-mint">
                    <Bell size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-slate">{item.message}</p>
                    <p className="text-xs text-slate">{formatRelativeDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate">No notifications yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          action={
            <Button onClick={() => router.push("/documents")} variant="ghost">
              Open chamber
            </Button>
          }
          description="Recent uploads and review status"
          title="Documents"
        >
          <div className="space-y-4">
            {summary?.recentDocuments.length ? (
              summary.recentDocuments.map((document) => (
                <div className="rounded-[24px] border border-slate-100 bg-white p-4" key={document.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{document.title}</p>
                      <p className="text-sm text-slate">
                        Version {document.version} | Updated {formatRelativeDate(document.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        document.status === "SIGNED"
                          ? "success"
                          : document.status === "ARCHIVED"
                            ? "neutral"
                            : document.status === "UNDER_REVIEW"
                              ? "warning"
                              : "accent"
                      }
                    >
                      {document.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate">No documents available yet.</p>
            )}
          </div>
        </Card>

        <Card
          action={
            <Button onClick={() => router.push("/payments")} variant="ghost">
              Open payments
            </Button>
          }
          description="Recent wallet movements"
          title="Transactions"
        >
          <div className="space-y-4">
            {summary?.recentTransactions.length ? (
              summary.recentTransactions.map((transaction) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-100 bg-white p-4"
                  key={transaction.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-mint" />
                      <p className="font-semibold text-ink">{transaction.type}</p>
                      <Badge tone={transactionToneMap[transaction.status]}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate">{formatRelativeDate(transaction.createdAt)}</p>
                  </div>
                  <p className="font-display text-2xl text-ink">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate">No transactions yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card
        action={
          <Button onClick={() => router.push("/profile")} variant="ghost">
            Review profile
          </Button>
        }
        description="Suggested matches based on the opposite role"
        title={expectedRole === "INVESTOR" ? "Suggested founders" : "Suggested investors"}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary?.suggestedUsers.length ? (
            summary.suggestedUsers.map((candidate) => (
              <div className="rounded-[24px] border border-slate-100 bg-sand/70 p-5" key={candidate.id}>
                <p className="font-semibold text-ink">{candidate.fullName}</p>
                <p className="mt-1 text-sm text-slate">
                  {candidate.startupName ?? candidate.firmName ?? candidate.industry ?? "Nexus member"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="accent">{candidate.role}</Badge>
                  {candidate.location ? <Badge>{candidate.location}</Badge> : null}
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-slate">
                  {candidate.pitchSummary ?? candidate.investmentFocus ?? candidate.bio ?? "No summary yet."}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate">
              Suggestions will appear once more users join the workspace.
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
};
