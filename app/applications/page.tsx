"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function ApplicationsPage() {
  const { user } = useUser();
  const applications = useQuery(
    api.jobs.listMyApplications,
    user ? {} : "skip",
  );

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Your applications
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Track where you&apos;ve applied and how each process is moving.
            </p>
          </div>
        </header>

        <SignedOut>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Sign in to see applications linked to your Jobly account.
            </p>
            <SignInButton mode="modal">
              <button className="px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-3">
            {applications === undefined ? (
              <p className="text-sm text-slate-500">Loading your applications…</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-slate-500">
                You haven&apos;t applied to any roles yet.{" "}
                <Link href="/jobs" className="underline hover:no-underline">
                  Browse open roles
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {app.job?.organizationId ? "Jobly employer" : "Employer"}
                        </p>
                        <p className="text-sm font-semibold">{app.job?.title ?? "Role"}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {statusLabel(app.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SignedIn>
      </div>
    </main>
  );
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

