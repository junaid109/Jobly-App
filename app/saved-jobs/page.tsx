"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function SavedJobsPage() {
  const { user } = useUser();
  const savedJobs = useQuery(api.jobs.listSavedJobs, user ? {} : "skip");
  const unsaveJob = useMutation(api.jobs.unsaveJob);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f4eb_0%,#f8fafc_24%,#ffffff_100%)] text-foreground px-6 py-10 md:px-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Saved jobs
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
              Keep your best opportunities in one place
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Save jobs as you browse so you can compare them later and apply when you&apos;re
              ready.
            </p>
          </div>
          <Link
            href="/job-alerts"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          >
            Manage alerts
          </Link>
        </header>

        <SignedOut>
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.28)]">
            <p className="text-sm text-stone-600 mb-4">
              Sign in to save jobs and keep your shortlist in sync across sessions.
            </p>
            <SignInButton mode="modal">
              <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {savedJobs === undefined ? (
            <p className="text-sm text-stone-500">Loading your saved jobs…</p>
          ) : savedJobs.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-stone-900">No saved jobs yet</p>
              <p className="mt-2 text-sm text-stone-600">
                Start saving roles from the search results page or job detail page.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Find jobs
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedJobs.map((savedJob) => (
                <div
                  key={savedJob._id}
                  className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.25)]"
                >
                  {savedJob.job ? (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                          {savedJob.job.organizationName}
                        </p>
                        <Link href={`/jobs/${savedJob.job._id}`} className="block">
                          <h2 className="mt-2 text-xl font-semibold text-stone-950">
                            {savedJob.job.title}
                          </h2>
                        </Link>
                        <p className="mt-2 text-sm text-stone-600">
                          {savedJob.job.location} • {readableType(savedJob.job.type)}
                        </p>
                        {(savedJob.job.salaryMin || savedJob.job.salaryMax) && (
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {formatSalaryRange(savedJob.job.salaryMin, savedJob.job.salaryMax)}
                          </p>
                        )}
                        <p className="mt-3 text-xs text-stone-500">
                          Saved {new Date(savedJob.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void unsaveJob({ jobId: savedJob.jobId })}
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          This saved job is no longer available.
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Saved {new Date(savedJob.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void unsaveJob({ jobId: savedJob.jobId })}
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SignedIn>
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
