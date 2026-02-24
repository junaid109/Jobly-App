"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function JobsPage() {
  const jobs = useQuery(api.jobs.listPublicJobs) ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Find your next role
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base mt-2">
              Explore curated opportunities from teams hiring on Jobly. Apply once, stay in sync.
            </p>
          </div>
        </header>

        <div className="mt-4 grid gap-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">
              No jobs posted yet. Check back soon as employers start hiring on Jobly.
            </p>
          ) : (
            jobs.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {job.organizationName}
                    </p>
                    <h2 className="text-lg font-semibold mb-1">{job.title}</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {job.location} • {readableType(job.type)}
                    </p>
                  </div>
                </div>
                {job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.tags.slice(0, 4).map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </section>
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

