"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  fullName: string;
  bio: string;
  location: string;
  website: string;
  preferences: string;
  startupName: string;
  startupStage: string;
  industry: string;
  pitchSummary: string;
  fundingNeeded: string;
  previousFunding: string;
  firmName: string;
  investmentFocus: string;
  ticketSizeMin: string;
  ticketSizeMax: string;
  portfolioHistory: string;
  preferredIndustries: string;
};

const emptyForm: FormState = {
  fullName: "",
  bio: "",
  location: "",
  website: "",
  preferences: "{}",
  startupName: "",
  startupStage: "",
  industry: "",
  pitchSummary: "",
  fundingNeeded: "",
  previousFunding: "",
  firmName: "",
  investmentFocus: "",
  ticketSizeMin: "",
  ticketSizeMax: "",
  portfolioHistory: "",
  preferredIndustries: "",
};

export const ProfileEditor = () => {
  const { user, token, refreshSession, setUser } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      fullName: user.fullName ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
      preferences: JSON.stringify(user.preferences ?? {}, null, 2),
      startupName: user.startupName ?? "",
      startupStage: user.startupStage ?? "",
      industry: user.industry ?? "",
      pitchSummary: user.pitchSummary ?? "",
      fundingNeeded: user.fundingNeeded?.toString() ?? "",
      previousFunding: user.previousFunding ?? "",
      firmName: user.firmName ?? "",
      investmentFocus: user.investmentFocus ?? "",
      ticketSizeMin: user.ticketSizeMin?.toString() ?? "",
      ticketSizeMax: user.ticketSizeMax?.toString() ?? "",
      portfolioHistory: user.portfolioHistory ?? "",
      preferredIndustries: user.preferredIndustries.join(", "),
    });
  }, [user]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !user) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const preferences = form.preferences.trim()
        ? (JSON.parse(form.preferences) as Record<string, unknown>)
        : {};

      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        bio: form.bio || null,
        location: form.location || null,
        website: form.website || null,
        preferences,
      };

      if (user.role === "ENTREPRENEUR") {
        payload.startupName = form.startupName || null;
        payload.startupStage = form.startupStage || null;
        payload.industry = form.industry || null;
        payload.pitchSummary = form.pitchSummary || null;
        payload.fundingNeeded = form.fundingNeeded ? Number(form.fundingNeeded) : null;
        payload.previousFunding = form.previousFunding || null;
      } else {
        payload.firmName = form.firmName || null;
        payload.investmentFocus = form.investmentFocus || null;
        payload.ticketSizeMin = form.ticketSizeMin ? Number(form.ticketSizeMin) : null;
        payload.ticketSizeMax = form.ticketSizeMax ? Number(form.ticketSizeMax) : null;
        payload.portfolioHistory = form.portfolioHistory || null;
        payload.preferredIndustries = form.preferredIndustries
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      }

      const updatedUser = await apiFetch<User>("/users/me", {
        method: "PUT",
        token,
        body: payload,
      });

      setUser(updatedUser);
      await refreshSession();
      setSuccess("Profile updated successfully.");
    } catch (caughtError) {
      if (caughtError instanceof SyntaxError) {
        setError("Preferences must be valid JSON.");
      } else {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : "Unable to save your profile right now.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      description="Keep your public-facing investor or founder profile current so scheduling, diligence, and matching stay relevant."
      title="Profile"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card description="Core identity and collaboration settings" title="Profile basics">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Full name"
              onChange={(event) => updateField("fullName", event.target.value)}
              value={form.fullName}
            />
            <Input label="Email" disabled value={user?.email ?? ""} />
            <Input label="Role" disabled value={user?.role ?? ""} />
            <Input
              label="Location"
              onChange={(event) => updateField("location", event.target.value)}
              value={form.location}
            />
            <div className="md:col-span-2">
              <Input
                label="Website"
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://"
                value={form.website}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Bio"
                onChange={(event) => updateField("bio", event.target.value)}
                value={form.bio}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                hint="Stored as JSON so the backend can evolve without hard-coding every preference."
                label="Preferences JSON"
                onChange={(event) => updateField("preferences", event.target.value)}
                value={form.preferences}
              />
            </div>
          </div>
        </Card>

        {user?.role === "ENTREPRENEUR" ? (
          <Card description="Founder-specific information used across dashboards and diligence." title="Startup profile">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Startup name"
                onChange={(event) => updateField("startupName", event.target.value)}
                value={form.startupName}
              />
              <Input
                label="Startup stage"
                onChange={(event) => updateField("startupStage", event.target.value)}
                value={form.startupStage}
              />
              <Input
                label="Industry"
                onChange={(event) => updateField("industry", event.target.value)}
                value={form.industry}
              />
              <Input
                label="Funding needed"
                onChange={(event) => updateField("fundingNeeded", event.target.value)}
                type="number"
                value={form.fundingNeeded}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Pitch summary"
                  onChange={(event) => updateField("pitchSummary", event.target.value)}
                  value={form.pitchSummary}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Previous funding"
                  onChange={(event) => updateField("previousFunding", event.target.value)}
                  value={form.previousFunding}
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card description="Investor-specific information for founder matching and pipeline context." title="Investment profile">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Firm name"
                onChange={(event) => updateField("firmName", event.target.value)}
                value={form.firmName}
              />
              <Input
                label="Preferred industries"
                onChange={(event) => updateField("preferredIndustries", event.target.value)}
                placeholder="AI, FinTech, SaaS"
                value={form.preferredIndustries}
              />
              <Input
                label="Minimum ticket size"
                onChange={(event) => updateField("ticketSizeMin", event.target.value)}
                type="number"
                value={form.ticketSizeMin}
              />
              <Input
                label="Maximum ticket size"
                onChange={(event) => updateField("ticketSizeMax", event.target.value)}
                type="number"
                value={form.ticketSizeMax}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Investment focus"
                  onChange={(event) => updateField("investmentFocus", event.target.value)}
                  value={form.investmentFocus}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Portfolio history"
                  onChange={(event) => updateField("portfolioHistory", event.target.value)}
                  value={form.portfolioHistory}
                />
              </div>
            </div>
          </Card>
        )}

        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}

        <div className="flex justify-end">
          <Button disabled={isSaving} size="lg" type="submit">
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
};
