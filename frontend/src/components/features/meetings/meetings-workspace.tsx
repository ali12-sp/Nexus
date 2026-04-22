"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameWeek,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Search, Video } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError } from "@/lib/api";
import type { Meeting, User } from "@/lib/types";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MeetingFormState = {
  inviteeId: string;
  title: string;
  agenda: string;
  notes: string;
  startTime: string;
  endTime: string;
  timezone: string;
};

const getMeetingTone = (status: Meeting["status"]) => {
  if (status === "ACCEPTED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "COMPLETED") return "accent";
  return "danger";
};

export const MeetingsWorkspace = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const deferredSearch = useDeferredValue(search);
  const [form, setForm] = useState<MeetingFormState>(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    return {
      inviteeId: "",
      title: "",
      agenda: "",
      notes: "",
      startTime: toDateTimeLocalValue(start.toISOString()),
      endTime: toDateTimeLocalValue(end.toISOString()),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  });

  const loadWorkspace = async (searchValue = "") => {
    if (!token || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const role = user.role === "INVESTOR" ? "ENTREPRENEUR" : "INVESTOR";
      const [meetingList, userList] = await Promise.all([
        apiFetch<Meeting[]>("/meetings", { token }),
        apiFetch<User[]>(
          `/users?role=${role}${searchValue ? `&search=${encodeURIComponent(searchValue)}` : ""}`,
          { token },
        ),
      ]);

      startTransition(() => {
        setMeetings(meetingList);
        setUsers(userList.filter((candidate) => candidate.id !== user.id));
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load meetings right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace(deferredSearch);
  }, [deferredSearch, token, user]);

  useEffect(() => {
    if (!meetings.length) {
      return;
    }

    const hasMeetingInActiveWeek = meetings.some((meeting) =>
      isSameWeek(new Date(meeting.startTime), calendarDate, { weekStartsOn: 1 }),
    );

    if (!hasMeetingInActiveWeek) {
      return;
    }

    const hasMeetingOnSelectedDay = meetings.some((meeting) =>
      isSameDay(new Date(meeting.startTime), selectedDate),
    );

    if (!hasMeetingOnSelectedDay) {
      const firstMeetingInWeek = meetings.find((meeting) =>
        isSameWeek(new Date(meeting.startTime), calendarDate, { weekStartsOn: 1 }),
      );

      if (firstMeetingInWeek) {
        setSelectedDate(new Date(firstMeetingInWeek.startTime));
      }
    }
  }, [calendarDate, meetings, selectedDate]);

  const updateForm = (field: keyof MeetingFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateMeeting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch<Meeting>("/meetings", {
        method: "POST",
        token,
        body: {
          inviteeId: form.inviteeId,
          title: form.title,
          agenda: form.agenda || null,
          notes: form.notes || null,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          timezone: form.timezone,
        },
      });

      setForm((current) => ({
        ...current,
        inviteeId: "",
        title: "",
        agenda: "",
        notes: "",
      }));

      await loadWorkspace(deferredSearch);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to create the meeting.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const respondToMeeting = async (meetingId: string, status: "ACCEPTED" | "REJECTED") => {
    if (!token) {
      return;
    }

    try {
      await apiFetch(`/meetings/${meetingId}/respond`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadWorkspace(deferredSearch);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to update the meeting.",
      );
    }
  };

  const cancelMeeting = async (meetingId: string) => {
    if (!token) {
      return;
    }

    try {
      await apiFetch(`/meetings/${meetingId}/cancel`, {
        method: "PATCH",
        token,
        body: {},
      });
      await loadWorkspace(deferredSearch);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to cancel the meeting.",
      );
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(calendarDate, { weekStartsOn: 1 }),
    end: endOfWeek(calendarDate, { weekStartsOn: 1 }),
  });

  const meetingsInSelectedWeek = meetings.filter((meeting) =>
    isSameWeek(new Date(meeting.startTime), calendarDate, { weekStartsOn: 1 }),
  );

  const selectedDayMeetings = meetingsInSelectedWeek.filter((meeting) =>
    isSameDay(new Date(meeting.startTime), selectedDate),
  );

  const getCounterpartyLabel = (meeting: Meeting) => {
    if (meeting.organizerId === user?.id) {
      return meeting.invitee?.fullName ?? "Counterparty";
    }

    return meeting.organizer?.fullName ?? "Counterparty";
  };

  return (
    <AppShell
      description="Schedule collaboration windows, avoid double bookings, and send accepted meetings directly into the video room."
      title="Meetings"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          action={
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={16} />
              <Input
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search counterparties"
                value={search}
              />
            </div>
          }
          description="Invite an investor or founder into a structured meeting window."
          title="Schedule a meeting"
        >
          <form className="space-y-5" onSubmit={handleCreateMeeting}>
            <Select
              label="Invitee"
              onChange={(event) => updateForm("inviteeId", event.target.value)}
              value={form.inviteeId}
            >
              <option value="">Select a counterparty</option>
              {users.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName} {candidate.startupName ? `| ${candidate.startupName}` : ""}
                  {candidate.firmName ? `| ${candidate.firmName}` : ""}
                </option>
              ))}
            </Select>
            <Input
              label="Title"
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Seed diligence call"
              value={form.title}
            />
            <Textarea
              label="Agenda"
              onChange={(event) => updateForm("agenda", event.target.value)}
              placeholder="What should be covered?"
              value={form.agenda}
            />
            <Textarea
              label="Notes"
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Optional private notes"
              value={form.notes}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Start"
                onChange={(event) => updateForm("startTime", event.target.value)}
                type="datetime-local"
                value={form.startTime}
              />
              <Input
                label="End"
                onChange={(event) => updateForm("endTime", event.target.value)}
                type="datetime-local"
                value={form.endTime}
              />
            </div>
            <Input
              label="Timezone"
              onChange={(event) => updateForm("timezone", event.target.value)}
              value={form.timezone}
            />

            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}

            <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
              <CalendarPlus className="mr-2" size={16} />
              {isSubmitting ? "Scheduling..." : "Schedule meeting"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setCalendarDate((current) => subWeeks(current, 1))}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="mr-1" size={14} />
                  Week
                </Button>
                <Button
                  onClick={() => {
                    const today = new Date();
                    setCalendarDate(startOfWeek(today, { weekStartsOn: 1 }));
                    setSelectedDate(today);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Today
                </Button>
                <Button
                  onClick={() => setCalendarDate((current) => addWeeks(current, 1))}
                  size="sm"
                  variant="outline"
                >
                  Week
                  <ChevronRight className="ml-1" size={14} />
                </Button>
              </div>
            }
            description="A weekly calendar view of accepted, pending, and cancelled collaboration windows."
            title="Scheduling calendar"
          >
            <div className="rounded-[24px] border border-slate-100 bg-sand/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {format(weekDays[0], "MMMM d")} - {format(weekDays[6], "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-slate">
                    {meetingsInSelectedWeek.length} meeting{meetingsInSelectedWeek.length === 1 ? "" : "s"} scheduled this week
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate">
                  <CalendarDays size={16} />
                  Click a day to inspect its schedule
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {weekDays.map((day) => {
                  const meetingsForDay = meetingsInSelectedWeek.filter((meeting) =>
                    isSameDay(new Date(meeting.startTime), day),
                  );
                  const isActiveDay = isSameDay(day, selectedDate);

                  return (
                    <button
                      className={`rounded-[24px] border p-4 text-left transition ${
                        isActiveDay
                          ? "border-mint bg-mint/10 shadow-soft"
                          : "border-slate-100 bg-white hover:border-mint/20 hover:bg-mint/5"
                      }`}
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      type="button"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                        {format(day, "EEE")}
                      </p>
                      <p className="mt-2 font-display text-2xl text-ink">{format(day, "d")}</p>
                      <p className="mt-2 text-sm text-slate">
                        {meetingsForDay.length
                          ? `${meetingsForDay.length} scheduled`
                          : "No meetings"}
                      </p>
                      {meetingsForDay.slice(0, 2).map((meeting) => (
                        <div
                          className="mt-3 rounded-2xl bg-sand px-3 py-2 text-xs text-ink"
                          key={meeting.id}
                        >
                          <p className="font-semibold">{meeting.title}</p>
                          <p>{format(new Date(meeting.startTime), "p")}</p>
                        </div>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </p>
                  <p className="text-sm text-slate">
                    Detailed view for the selected day.
                  </p>
                </div>
                <Badge tone={selectedDayMeetings.length ? "accent" : "neutral"}>
                  {selectedDayMeetings.length} agenda item{selectedDayMeetings.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {selectedDayMeetings.length ? (
                <div className="mt-4 space-y-3">
                  {selectedDayMeetings.map((meeting) => (
                    <div
                      className="flex flex-col gap-3 rounded-[24px] bg-sand/70 p-4 lg:flex-row lg:items-center lg:justify-between"
                      key={meeting.id}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-ink">{meeting.title}</p>
                          <Badge tone={getMeetingTone(meeting.status)}>{meeting.status}</Badge>
                        </div>
                        <p className="text-sm text-slate">
                          {format(new Date(meeting.startTime), "p")} - {format(new Date(meeting.endTime), "p")}
                        </p>
                        <p className="text-sm text-slate">
                          With {getCounterpartyLabel(meeting)}
                        </p>
                      </div>
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
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate">
                  No meetings are booked on this day yet.
                </p>
              )}
            </div>
          </Card>

          <Card
            action={
              <Button onClick={() => void loadWorkspace(deferredSearch)} variant="outline">
                Refresh list
              </Button>
            }
            description="Pending, accepted, and cancelled meeting activity for the current user."
            title="Meeting timeline"
          >
            {isLoading ? (
              <p className="text-sm text-slate">Loading meetings...</p>
            ) : meetings.length ? (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const isInvitee = meeting.inviteeId === user?.id;
                  const canCancel = meeting.status === "PENDING" || meeting.status === "ACCEPTED";

                  return (
                    <div
                      className="rounded-[28px] border border-slate-100 bg-sand/70 p-5"
                      key={meeting.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-semibold text-ink">{meeting.title}</p>
                            <Badge tone={getMeetingTone(meeting.status)}>{meeting.status}</Badge>
                          </div>
                          <p className="text-sm text-slate">{formatDateTime(meeting.startTime)}</p>
                          <p className="text-sm text-slate">
                            {isInvitee
                              ? `Organized by ${meeting.organizer?.fullName ?? "Nexus user"}`
                              : `Invited ${meeting.invitee?.fullName ?? "Nexus user"}`}
                          </p>
                          {meeting.agenda ? <p className="text-sm text-slate">{meeting.agenda}</p> : null}
                          {meeting.notes ? <p className="text-sm text-slate">{meeting.notes}</p> : null}
                        </div>

                        <div className="flex flex-wrap gap-3">
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
                          {isInvitee && meeting.status === "PENDING" ? (
                            <>
                              <Button
                                onClick={() => void respondToMeeting(meeting.id, "ACCEPTED")}
                                variant="secondary"
                              >
                                Accept
                              </Button>
                              <Button
                                onClick={() => void respondToMeeting(meeting.id, "REJECTED")}
                                variant="outline"
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {canCancel ? (
                            <Button onClick={() => void cancelMeeting(meeting.id)} variant="ghost">
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate">No meetings have been scheduled yet.</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
