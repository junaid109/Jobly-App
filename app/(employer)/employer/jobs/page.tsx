"use client";

import { useOrganization, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function EmployerJobsPage() {
  const { organization } = useOrganization();
  const clerkOrgId = organization?.id;

  const jobs = useQuery(
    api.orgs.listOrgJobs,
    clerkOrgId ? { clerkOrgId } : "skip",
  );

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Your job postings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Create and manage the roles your team is hiring for.
            </p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium"
          >
            Post a job
          </Link>
        </header>

        <SignedOut>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Sign in and select a Clerk Organization to manage its job postings.
            </p>
            <SignInButton mode="modal">
              <button className="px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {!organization ? (
            <p className="text-sm text-slate-500">
              Choose an organization via the Clerk organization switcher to see its roles.
            </p>
          ) : jobs === undefined ? (
            <p className="text-sm text-slate-500">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-slate-500">
              This organization doesn&apos;t have any jobs yet.{" "}
              <Link href="/employer/jobs/new" className="underline hover:no-underline">
                Create the first role
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/employer/jobs/${job._id}`}
                  className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Role</p>
                      <p className="text-sm font-semibold">{job.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {job.location}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      {job.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SignedIn>
      </div>
    </main>
  );
}
