"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useState } from "react";

export default function JobAlertsPage() {
  const { user } = useUser();
  const alerts = useQuery(api.jobs.listJobAlerts, user ? {} : "skip");
  const deleteJobAlert = useMutation(api.jobs.deleteJobAlert);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f4eb_0%,#f8fafc_24%,#ffffff_100%)] text-foreground px-6 py-10 md:px-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Job alerts
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
              Stay on top of the searches you care about
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Create alerts from your current search filters and come back here to manage them.
            </p>
          </div>
          <Link
            href="/jobs"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          >
            Back to jobs
          </Link>
        </header>

        <SignedOut>
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.28)]">
            <p className="text-sm text-stone-600 mb-4">
              Sign in to create and manage alerts for your searches.
            </p>
            <SignInButton mode="modal">
              <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {alerts === undefined ? (
            <p className="text-sm text-stone-500">Loading your alerts…</p>
          ) : alerts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-stone-900">No alerts yet</p>
              <p className="mt-2 text-sm text-stone-600">
                Run a search on the jobs page and click Create alert to save it.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Create your first alert
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.25)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                      <h2 className="text-xl font-semibold text-stone-950">
                        {describeAlert(alert)}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {alert.types.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] text-stone-600"
                          >
                            {readableType(type)}
                          </span>
                        ))}
                        {alert.remoteOnly ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                            Remote only
                          </span>
                        ) : null}
                        {alert.minSalary ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-700">
                            ${alert.minSalary.toLocaleString()}+
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setDeleteError(null);
                          await deleteJobAlert({ alertId: alert._id });
                        } catch (error: unknown) {
                          setDeleteError(
                            error instanceof Error
                              ? error.message
                              : "We couldn't delete this alert.",
                          );
                        }
                      }}
                      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deleteError ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{deleteError}</p>
          ) : null}
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

function describeAlert(alert: {
  keyword?: string;
  location?: string;
  types: string[];
  remoteOnly: boolean;
  minSalary?: number;
}) {
  const parts = [
    alert.keyword || "All roles",
    alert.location || "any location",
  ];
  return parts.join(" in ");
}
