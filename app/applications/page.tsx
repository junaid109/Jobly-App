"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ApplicationsPage() {
  const { user } = useUser();
  const applications = useQuery(api.jobs.listMyApplications, user ? {} : "skip");
  const profileSummary = useQuery(api.jobs.getMyProfile, user ? {} : "skip");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f1e6_0%,#f8fafc_24%,#ffffff_100%)] px-6 py-10 text-foreground md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Applications
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
              Track every application from one candidate workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Review where you&apos;ve applied, see how each process is moving, and keep your
              seeker profile in shape for the next role.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/profile"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Edit profile
            </Link>
            <Link
              href="/saved-jobs"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Saved jobs
            </Link>
            <Link
              href="/job-alerts"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Job alerts
            </Link>
          </div>
        </header>

        <SignedOut>
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.28)]">
            <p className="text-sm text-stone-600">
              Sign in to see your applications, profile completion, and saved candidate history.
            </p>
            <SignInButton mode="modal">
              <button className="mt-4 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {applications === undefined || profileSummary === undefined ? (
            <p className="text-sm text-stone-500">Loading your candidate workspace…</p>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Applications sent"
                  value={String(applications.length)}
                  tone="light"
                />
                <MetricCard
                  label="Profile completion"
                  value={`${profileSummary.completionPercent}%`}
                  tone="dark"
                />
                <MetricCard
                  label="Missing profile signals"
                  value={String(profileSummary.missingFields.length)}
                  tone="warm"
                />
              </section>

              <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="space-y-4">
                  <div className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.22)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Profile checklist
                    </p>
                    <p className="mt-3 text-sm text-stone-600">
                      Keep your reusable candidate details current so the next application takes
                      less work.
                    </p>
                    {profileSummary.missingFields.length === 0 ? (
                      <p className="mt-4 text-sm font-medium text-emerald-700">
                        Your profile is complete.
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profileSummary.missingFields.map((field) => (
                          <span
                            key={field}
                            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-700"
                          >
                            {fieldLabel(field)}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/profile"
                      className="mt-5 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
                    >
                      Update seeker profile
                    </Link>
                  </div>

                  <div className="rounded-[1.8rem] border border-stone-200 bg-[#fbf7ef] p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.18)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Follow-up view
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-stone-600">
                      <p>Each application now keeps a status history instead of a single label.</p>
                      <p>When employers move you forward, the updated step shows up in your timeline.</p>
                    </div>
                  </div>
                </aside>

                <section className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
                      <p className="text-lg font-semibold text-stone-900">No applications yet</p>
                      <p className="mt-2 text-sm text-stone-600">
                        Start exploring open roles, save promising jobs, and apply when you&apos;re
                        ready.
                      </p>
                      <div className="mt-5 flex justify-center gap-3">
                        <Link
                          href="/jobs"
                          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                        >
                          Browse jobs
                        </Link>
                        <Link
                          href="/profile"
                          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900"
                        >
                          Finish profile
                        </Link>
                      </div>
                    </div>
                  ) : (
                    applications.map((application) => (
                      <article
                        key={application._id}
                        className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.22)]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                              {application.job?.organizationName ?? "Employer"}
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                              {application.job?.title ?? "Role unavailable"}
                            </h2>
                            {application.job ? (
                              <p className="mt-2 text-sm text-stone-600">
                                {application.job.location} • {readableType(application.job.type)}
                                {application.job.salaryMin || application.job.salaryMax
                                  ? ` • ${formatSalaryRange(
                                      application.job.salaryMin,
                                      application.job.salaryMax,
                                    )}`
                                  : ""}
                              </p>
                            ) : null}
                            <p className="mt-3 text-xs text-stone-500">
                              Applied {new Date(application.createdAt).toLocaleDateString()}
                              {" • "}
                              Last updated {new Date(application.updatedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(application.status)}`}>
                              {statusLabel(application.status)}
                            </span>
                            {application.job ? (
                              <Link
                                href={`/jobs/${application.job._id}`}
                                className="rounded-full border border-stone-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700 hover:bg-stone-50"
                              >
                                View role
                              </Link>
                            ) : null}
                          </div>
                        </div>

                        {(application.resumeText || application.coverLetter) && (
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {application.resumeText ? (
                              <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                                  Resume summary used
                                </p>
                                <p className="mt-3 text-sm leading-6 text-stone-700">
                                  {application.resumeText}
                                </p>
                              </div>
                            ) : null}
                            {application.coverLetter ? (
                              <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                                  Cover letter
                                </p>
                                <p className="mt-3 text-sm leading-6 text-stone-700">
                                  {application.coverLetter}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div className="mt-5 rounded-[1.3rem] border border-stone-200 bg-[#fcfaf5] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                            Status timeline
                          </p>
                          <div className="mt-4 grid gap-3">
                            {[...application.statusHistory]
                              .sort((a, b) => b.changedAt - a.changedAt)
                              .map((event) => (
                                <div
                                  key={`${event.status}-${event.changedAt}`}
                                  className="flex items-start justify-between gap-4 rounded-[1rem] border border-stone-200 bg-white px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-stone-900">
                                      {statusLabel(event.status)}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500">
                                      Updated by {actorLabel(event.changedBy)}
                                    </p>
                                  </div>
                                  <p className="text-xs text-stone-500">
                                    {new Date(event.changedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </section>
              </section>
            </>
          )}
        </SignedIn>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "light" | "dark" | "warm";
}) {
  const toneClasses =
    tone === "dark"
      ? "bg-stone-950 text-white border-stone-950"
      : tone === "warm"
        ? "bg-[#fbf7ef] text-stone-950 border-stone-200"
        : "bg-white text-stone-950 border-stone-200";

  return (
    <div className={`rounded-[1.6rem] border p-5 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.18)] ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function readableType(type: string) {
  switch (type) {
    case "full_time":
      return "Full-time";
    case "part_time":
      return "Part-time";
    case "contract":
      return "Contract";
    case "internship":
      return "Internship";
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    default:
      return type;
  }
}

function formatSalaryRange(
  salaryMin: number | undefined,
  salaryMax: number | undefined,
) {
  if (salaryMin && salaryMax) {
    return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
  }
  if (salaryMin) {
    return `From $${salaryMin.toLocaleString()}`;
  }
  if (salaryMax) {
    return `Up to $${salaryMax.toLocaleString()}`;
  }
  return "Compensation not listed";
}

function statusLabel(status: string) {
  switch (status) {
    case "applied":
      return "Applied";
    case "in_review":
      return "In review";
    case "interview":
      return "Interview";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "offer":
      return "bg-emerald-100 text-emerald-800";
    case "interview":
      return "bg-sky-100 text-sky-800";
    case "in_review":
      return "bg-amber-100 text-amber-900";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function actorLabel(actor: string) {
  switch (actor) {
    case "employer":
      return "the employer";
    case "seeker":
      return "you";
    default:
      return "the system";
  }
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
