"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmployerJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as Id<"jobs">;
  const { organization } = useOrganization();
  const clerkOrgId = organization?.id;
  const bootstrapOrganizationAccess = useMutation(api.orgs.bootstrapOrganizationAccess);
  const repairMyOrgRole = useMutation(api.orgs.repairMyOrgRole);
  const updateApplicationStatus = useMutation(api.orgs.updateApplicationStatus);
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

  const data = useQuery(
    api.orgs.getOrgJobWithApplicants,
    jobId && clerkOrgId && bootstrapDone ? { jobId, clerkOrgId } : "skip",
  );

  if (!clerkOrgId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Select an organization to view this role.</p>
      </main>
    );
  }

  if (bootstrapError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-amber-700">
          Workspace initialization failed ({bootstrapError}).{" "}
          <Link href="/onboarding" className="underline hover:no-underline">
            Re-run onboarding sync
          </Link>
          .
        </p>
      </main>
    );
  }

  if (!bootstrapDone) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Initializing organization workspace…</p>
      </main>
    );
  }

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
            {bootstrapRole === "viewer" && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">
                  You have viewer access. You can review applicants but cannot update application
                  statuses.
                </p>
              </div>
            )}
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
                        <select
                          className="rounded-md border border-slate-300 dark:border-slate-600 bg-background px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300"
                          value={app.status}
                          disabled={bootstrapRole === "viewer"}
                          onChange={(e) => {
                            if (!clerkOrgId || bootstrapRole === "viewer") return;
                            void updateApplicationStatus({
                              clerkOrgId,
                              jobId,
                              applicationId: app._id,
                              status: e.target.value as ApplicationStatus,
                            });
                          }}
                        >
                          <option value="applied">Applied</option>
                          <option value="in_review">In review</option>
                          <option value="interview">Interviewing</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
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

type ApplicationStatus = "applied" | "in_review" | "interview" | "offer" | "rejected";
