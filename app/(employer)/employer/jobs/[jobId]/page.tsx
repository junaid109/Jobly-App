"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function EmployerJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as string;
  const data = useQuery(api.orgs.getOrgJobWithApplicants, jobId ? { jobId } : "skip");

  if (data === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading job…</p>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Job not found.</p>
      </main>
    );
  }

  const { job, applications } = data;

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Role</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {job.location} • {readableType(job.type)}
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5 text-sm">
            <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
            <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">
              {job.description}
            </p>
          </article>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
              <p className="text-xs font-medium text-slate-500 mb-2">Applicants</p>
              {applications.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No applicants yet. Share this role with your network to start the pipeline.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto text-xs">
                  {applications.map((app) => (
                    <div
                      key={app._id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-background p-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">Candidate</span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                          {statusLabel(app.status)}
                        </span>
                      </div>
                      {app.resumeText && (
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          {app.resumeText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
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

function statusLabel(status: string) {
  switch (status) {
    case "applied":
      return "Applied";
    case "in_review":
      return "In review";
    case "interview":
      return "Interviewing";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

