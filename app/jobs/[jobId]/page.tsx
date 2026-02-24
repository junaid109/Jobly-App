"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useState } from "react";

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as string;
  const job = useQuery(api.jobs.getJob, jobId ? { jobId } : "skip");
  const { user } = useUser();
  const applyToJob = useMutation(api.jobs.applyToJob);

  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    try {
      await applyToJob({
        jobId,
        resumeText: resumeText || undefined,
        coverLetter: coverLetter || undefined,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <p className="text-xs font-medium text-slate-500">{job.organizationName}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {job.location} • {readableType(job.type)}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {job.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <hr className="my-6 border-slate-200 dark:border-slate-800" />
          <article className="prose dark:prose-invert max-w-none text-sm">
            <p>{job.description}</p>
          </article>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-2">Apply to this role</h2>
            <SignedOut>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Sign in to apply with your Jobly profile and track your application in real time.
              </p>
              <SignInButton mode="modal">
                <button className="w-full px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium">
                  Sign in to apply
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              {submitted ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Application submitted. You can track status from your applications dashboard.
                </p>
              ) : (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Short resume or profile summary
                    </span>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                      rows={3}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Briefly summarize your experience for this role."
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Optional cover letter
                    </span>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Share why you’re excited about this opportunity."
                    />
                  </label>
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit application"}
                  </button>
                </div>
              )}
            </SignedIn>
          </div>
        </aside>
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

