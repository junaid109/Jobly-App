"use client";

import { useEffect, useState } from "react";
import { useOrganization, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function EmployerDashboardPage() {
  const { organization } = useOrganization();
  const clerkOrgId = organization?.id;
  const bootstrapOrganizationAccess = useMutation(api.orgs.bootstrapOrganizationAccess);
  const repairMyOrgRole = useMutation(api.orgs.repairMyOrgRole);
  const [bootstrapRole, setBootstrapRole] = useState<"admin" | "recruiter" | "viewer" | null>(null);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    setBootstrapAttempted(false);
    setBootstrapDone(false);
    setBootstrapError(null);
    setBootstrapRole(null);
  }, [clerkOrgId]);

  useEffect(() => {
    if (!organization || bootstrapAttempted) return;
    setBootstrapAttempted(true);
    void bootstrapOrganizationAccess({
      clerkOrgId: organization.id,
      name: organization.name,
    })
      .then(async (result) => {
        const repaired = await repairMyOrgRole({ clerkOrgId: organization.id });
        setBootstrapRole(repaired.newRole);
        if (!repaired.repaired) {
          setBootstrapRole(result.role);
        }
        setBootstrapDone(true);
        setBootstrapError(null);
      })
      .catch((error: unknown) => {
        setBootstrapError(error instanceof Error ? error.message : "Failed to sync organization.");
      });
  }, [bootstrapAttempted, bootstrapOrganizationAccess, organization, repairMyOrgRole]);

  const dashboard = useQuery(
    api.orgs.getOrgDashboard,
    clerkOrgId && bootstrapDone ? { clerkOrgId } : "skip",
  );

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Hiring workspace
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Manage roles, applicants, and your hiring pipeline for this organization.
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
              Sign in and select a Clerk Organization to access your employer dashboard.
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You&apos;re signed in but not currently viewing an organization. Use the Clerk
                organization switcher in the header to create or select a company workspace.
              </p>
            </div>
          ) : bootstrapError ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 md:p-5">
              <p className="text-sm text-amber-800">
                We couldn&apos;t initialize this organization workspace ({bootstrapError}).{" "}
                <Link href="/onboarding" className="underline hover:no-underline">
                  Re-run onboarding sync
                </Link>
                .
              </p>
            </div>
          ) : !bootstrapDone ? (
            <p className="text-sm text-slate-500">Initializing organization workspace…</p>
          ) : bootstrapRole === "viewer" ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 md:p-5">
              <p className="text-sm text-amber-800">
                You currently have viewer access. Ask an org admin to grant recruiter or admin role
                to post and manage jobs.
              </p>
            </div>
          ) : dashboard === undefined ? (
            <p className="text-sm text-slate-500">Loading organization data…</p>
          ) : !dashboard ? (
            <p className="text-sm text-slate-500">
              This organization doesn&apos;t have any data yet. Start by{" "}
              <Link href="/employer/jobs/new" className="underline hover:no-underline">
                posting a job
              </Link>
              .
            </p>
          ) : (
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Open roles</p>
                <p className="text-2xl font-semibold">{dashboard.stats.openJobs}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Total roles</p>
                <p className="text-2xl font-semibold">{dashboard.stats.totalJobs}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Applicants</p>
                <p className="text-2xl font-semibold">{dashboard.stats.totalApplicants}</p>
              </div>
            </section>
          )}
        </SignedIn>
      </div>
    </main>
  );
}
