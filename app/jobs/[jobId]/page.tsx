"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJob, jobId ? { jobId } : "skip");
  const relatedJobs = useQuery(api.jobs.listRelatedJobs, jobId ? { jobId } : "skip") ?? [];
  const { user } = useUser();
  const applyToJob = useMutation(api.jobs.applyToJob);
  const saveJob = useMutation(api.jobs.saveJob);
  const unsaveJob = useMutation(api.jobs.unsaveJob);
  const profileSummary = useQuery(api.jobs.getMyProfile, user ? {} : "skip");
  const savedJobIds = useQuery(api.jobs.listSavedJobIds, user ? {} : "skip") ?? [];
  const isSaved = savedJobIds.includes(jobId);

  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeText || !profileSummary?.profile) {
      return;
    }

    const starterText = [
      profileSummary.profile.headline,
      profileSummary.profile.summary,
      profileSummary.profile.experience,
    ]
      .filter(Boolean)
      .join(" ");

    if (starterText) {
      setResumeText(starterText);
    }
  }, [profileSummary, resumeText]);

  if (job === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading job…</p>
      </main>
    );
  }

  if (job === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">This job is no longer available.</p>
      </main>
    );
  }

  const onSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await applyToJob({
        jobId,
        resumeText: resumeText || undefined,
        coverLetter: coverLetter || undefined,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "We couldn't submit your application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleSaved = async () => {
    if (!user) return;
    setSaveError(null);
    try {
      if (isSaved) {
        await unsaveJob({ jobId });
      } else {
        await saveJob({ jobId });
      }
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "We couldn't update saved jobs.");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3e8_0%,#fbfdff_24%,#ffffff_100%)] text-foreground px-5 py-8 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_28px_80px_-44px_rgba(28,25,23,0.32)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_360px]">
            <section className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                  {job.organizationName}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
                  {timeAgo(job.createdAt)}
                </span>
              </div>

              <div>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-stone-950">
                  {job.title}
                </h1>
                <p className="mt-3 text-base text-stone-600">
                  {job.location} • {readableType(job.type)}
                </p>
                {job.salaryMin || job.salaryMax ? (
                  <p className="mt-3 text-lg font-medium text-stone-900">
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </p>
                ) : null}
              </div>

              {job.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] text-stone-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <DetailCard label="Work model" value={readableType(job.type)} />
                <DetailCard label="Location" value={job.location} />
                <DetailCard
                  label="Compensation"
                  value={formatSalaryRange(job.salaryMin, job.salaryMax)}
                />
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  About this role
                </p>
                <article className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">
                  {job.description}
                </article>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.6rem] border border-stone-200 bg-stone-950 p-5 text-white shadow-[0_24px_70px_-40px_rgba(28,25,23,0.45)]">
                <h2 className="text-sm font-semibold">Apply to this role</h2>
                <p className="mt-2 text-xs text-stone-300">
                  Keep your application short and clear. You can track updates from your
                  applications dashboard.
                </p>
                {profileSummary ? (
                  <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-300">
                      Seeker profile
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {profileSummary.completionPercent}% complete
                    </p>
                    <Link
                      href="/profile"
                      className="mt-3 inline-flex rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                    >
                      Update profile
                    </Link>
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950">
                        Sign in to apply
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={submitting || submitted}
                      className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 disabled:opacity-60"
                    >
                      {submitted ? "Applied" : submitting ? "Submitting…" : "Quick apply"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onToggleSaved()}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        isSaved
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                          : "border-white/20 bg-white/5 text-white"
                      }`}
                    >
                      {isSaved ? "Saved" : "Save job"}
                    </button>
                  </SignedIn>
                </div>

                <SignedIn>
                  {submitted ? (
                    <p className="mt-4 text-xs text-emerald-300">
                      Application submitted. Check your applications dashboard for updates.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="text-xs font-medium text-stone-300">
                          Short resume or profile summary
                        </span>
                        <textarea
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 text-sm px-3 py-2 text-white placeholder:text-stone-400"
                          rows={3}
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Briefly summarize your experience for this role."
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-stone-300">
                          Optional cover letter
                        </span>
                        <textarea
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 text-sm px-3 py-2 text-white placeholder:text-stone-400"
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Share why you’re excited about this opportunity."
                        />
                      </label>
                    </div>
                  )}

                  {submitError ? (
                    <p className="mt-3 text-xs text-rose-300">{submitError}</p>
                  ) : null}
                  {saveError ? <p className="mt-3 text-xs text-rose-300">{saveError}</p> : null}
                </SignedIn>
              </div>

              <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.3)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Why apply here
                </p>
                <div className="mt-4 space-y-3 text-sm text-stone-600">
                  <p>Live application tracking in your Jobly dashboard.</p>
                  <p>Clear role metadata with salary, location, and work-style context.</p>
                  <p>Easy save-and-return workflow while you compare roles.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <section className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.3)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                Related jobs
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Keep exploring similar roles
              </h2>
            </div>
            <Link
              href="/jobs"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Browse all jobs
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedJobs.length === 0 ? (
              <div className="rounded-[1.3rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-sm text-stone-500 md:col-span-2 xl:col-span-4">
                No related roles yet. Check back as more employers start posting similar jobs.
              </div>
            ) : (
              relatedJobs.map((relatedJob) => (
                <Link
                  key={relatedJob._id}
                  href={`/jobs/${relatedJob._id}`}
                  className="rounded-[1.3rem] border border-stone-200 bg-stone-50 p-4 hover:border-stone-400 hover:bg-white"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    {relatedJob.organizationName}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-stone-950">
                    {relatedJob.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {relatedJob.location} • {readableType(relatedJob.type)}
                  </p>
                  {(relatedJob.salaryMin || relatedJob.salaryMax) && (
                    <p className="mt-3 text-sm font-medium text-stone-900">
                      {formatSalaryRange(relatedJob.salaryMin, relatedJob.salaryMax)}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
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

function timeAgo(createdAt: number) {
  const diffInDays = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
  if (diffInDays === 1) {
    return "1 day ago";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}
