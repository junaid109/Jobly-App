"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

const WORK_PREFERENCE_OPTIONS = [
  { label: "On-site", value: "onsite" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Remote", value: "remote" },
  { label: "Flexible", value: "flexible" },
] as const;

type WorkPreference = (typeof WORK_PREFERENCE_OPTIONS)[number]["value"];

type ProfileFormState = {
  name: string;
  headline: string;
  location: string;
  skillsInput: string;
  experience: string;
  desiredTitle: string;
  workPreference: WorkPreference | "";
  summary: string;
  resumeUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

const EMPTY_FORM: ProfileFormState = {
  name: "",
  headline: "",
  location: "",
  skillsInput: "",
  experience: "",
  desiredTitle: "",
  workPreference: "",
  summary: "",
  resumeUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

function toProfileFormState(
  profile?: {
    name: string;
    headline: string;
    location: string;
    skills: string[];
    experience?: string;
    desiredTitle?: string;
    workPreference?: WorkPreference;
    summary?: string;
    resumeUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  } | null,
): ProfileFormState {
  if (!profile) {
    return EMPTY_FORM;
  }

  return {
    name: profile.name,
    headline: profile.headline,
    location: profile.location,
    skillsInput: profile.skills.join(", "),
    experience: profile.experience ?? "",
    desiredTitle: profile.desiredTitle ?? "",
    workPreference: profile.workPreference ?? "",
    summary: profile.summary ?? "",
    resumeUrl: profile.resumeUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
  };
}

function withDraft(
  current: ProfileFormState | null,
  fallback: ProfileFormState,
  patch: Partial<ProfileFormState>,
): ProfileFormState {
  return {
    ...(current ?? fallback),
    ...patch,
  };
}

export default function ProfilePage() {
  const { user } = useUser();
  const profileSummary = useQuery(api.jobs.getMyProfile, user ? {} : "skip");
  const upsertProfile = useMutation(api.jobs.upsertMyProfile);
  const [draft, setDraft] = useState<ProfileFormState | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const missingFields = profileSummary?.missingFields ?? [];
  const baseForm = toProfileFormState(profileSummary?.profile);
  const form = draft ?? baseForm;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e4_0%,#f8fafc_26%,#ffffff_100%)] px-6 py-10 text-foreground md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Seeker profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
              Complete the profile employers expect to see
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Build a stronger candidate profile with your headline, work preferences, skills, and
              resume links so applying feels faster and more credible.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/applications"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Your applications
            </Link>
            <Link
              href="/saved-jobs"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Saved jobs
            </Link>
          </div>
        </header>

        <SignedOut>
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.28)]">
            <p className="text-sm text-stone-600">
              Sign in to create a reusable Jobly profile and keep your applications organized.
            </p>
            <SignInButton mode="modal">
              <button className="mt-4 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {profileSummary === undefined ? (
            <p className="text-sm text-stone-500">Loading your profile…</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <div className="rounded-[1.8rem] border border-stone-200 bg-stone-950 p-6 text-white shadow-[0_24px_70px_-40px_rgba(28,25,23,0.4)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-300">
                    Completion
                  </p>
                  <p className="mt-3 text-4xl font-semibold">
                    {profileSummary.completionPercent}%
                  </p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${profileSummary.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm text-stone-300">
                    {profileSummary.completedFields} of {profileSummary.totalFields} profile signals
                    are complete.
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Still missing
                  </p>
                  {missingFields.length === 0 ? (
                    <p className="mt-3 text-sm text-emerald-700">
                      Your profile is fully filled out and ready to support future applications.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {missingFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-700"
                        >
                          {fieldLabel(field)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[1.8rem] border border-stone-200 bg-[#fbf7ef] p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.18)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Why it matters
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-stone-600">
                    <p>Faster quick-apply workflows when your core details are already in place.</p>
                    <p>Clearer candidate context when employers review your application.</p>
                    <p>Resume and portfolio links ready for future profile and company trust work.</p>
                  </div>
                </div>
              </aside>

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.22)] md:p-8">
                <form
                  className="space-y-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSaveError(null);
                    setSaveMessage(null);
                    setIsSaving(true);

                    void upsertProfile({
                      name: form.name,
                      headline: form.headline,
                      location: form.location,
                      skills: form.skillsInput
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                      experience: form.experience || undefined,
                      desiredTitle: form.desiredTitle || undefined,
                      workPreference: form.workPreference || undefined,
                      summary: form.summary || undefined,
                      resumeUrl: form.resumeUrl || undefined,
                      linkedinUrl: form.linkedinUrl || undefined,
                      portfolioUrl: form.portfolioUrl || undefined,
                    })
                      .then(() => {
                        setSaveMessage("Profile updated.");
                        setDraft(null);
                      })
                      .catch((error: unknown) => {
                        setSaveError(
                          error instanceof Error
                            ? error.message
                            : "We couldn't save your profile.",
                        );
                      })
                      .finally(() => {
                        setIsSaving(false);
                      });
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Full name"
                      value={form.name}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { name: value }))
                      }
                      placeholder="Jane Alvarez"
                    />
                    <Field
                      label="Location"
                      value={form.location}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { location: value }))
                      }
                      placeholder="London, UK"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Professional headline"
                      value={form.headline}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { headline: value }))
                      }
                      placeholder="Senior frontend engineer focused on product UX"
                    />
                    <Field
                      label="Desired title"
                      value={form.desiredTitle}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { desiredTitle: value }))
                      }
                      placeholder="Staff product designer"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <Field
                      label="Skills"
                      value={form.skillsInput}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { skillsInput: value }))
                      }
                      placeholder="React, TypeScript, Design systems"
                      helper="Separate skills with commas."
                    />
                    <label className="block">
                      <span className="text-sm font-medium text-stone-900">Work preference</span>
                      <select
                        value={form.workPreference}
                        onChange={(event) =>
                          setDraft((current) =>
                            withDraft(current, form, {
                              workPreference: event.target.value as WorkPreference | "",
                            }),
                          )
                        }
                        className="mt-2 w-full rounded-[1rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-900"
                      >
                        <option value="">Select</option>
                        {WORK_PREFERENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <TextAreaField
                    label="Experience highlights"
                    value={form.experience}
                    onChange={(value) =>
                      setDraft((current) => withDraft(current, form, { experience: value }))
                    }
                    placeholder="Summarize the most relevant roles, industries, or achievements you've had so far."
                    rows={4}
                  />

                  <TextAreaField
                    label="Profile summary"
                    value={form.summary}
                    onChange={(value) =>
                      setDraft((current) => withDraft(current, form, { summary: value }))
                    }
                    placeholder="Write the short version of how you present yourself to hiring teams."
                    rows={5}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field
                      label="Resume URL"
                      value={form.resumeUrl}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { resumeUrl: value }))
                      }
                      placeholder="https://..."
                    />
                    <Field
                      label="LinkedIn URL"
                      value={form.linkedinUrl}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { linkedinUrl: value }))
                      }
                      placeholder="https://linkedin.com/in/..."
                    />
                    <Field
                      label="Portfolio URL"
                      value={form.portfolioUrl}
                      onChange={(value) =>
                        setDraft((current) => withDraft(current, form, { portfolioUrl: value }))
                      }
                      placeholder="https://portfolio.site"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                    >
                      {isSaving ? "Saving…" : "Save profile"}
                    </button>
                    <Link
                      href="/jobs"
                      className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-stone-50"
                    >
                      Browse jobs
                    </Link>
                    {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
                    {saveError ? <p className="text-sm text-rose-600">{saveError}</p> : null}
                  </div>
                </form>
              </section>
            </div>
          )}
        </SignedIn>
      </div>
    </main>
  );
}

function fieldLabel(field: string) {
  switch (field) {
    case "desiredTitle":
      return "Desired title";
    case "workPreference":
      return "Work preference";
    case "resumeUrl":
      return "Resume link";
    case "linkedinUrl":
      return "LinkedIn";
    case "portfolioUrl":
      return "Portfolio";
    default:
      return field;
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[1rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-900"
      />
      {helper ? <span className="mt-2 block text-xs text-stone-500">{helper}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[1rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-900"
      />
    </label>
  );
}
