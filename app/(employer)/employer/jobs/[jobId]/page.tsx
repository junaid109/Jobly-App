"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { useOrganizationBootstrap } from "@/components/useOrganizationBootstrap";

type ApplicationStatus = "applied" | "in_review" | "interview" | "offer" | "rejected";
type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "remote"
  | "hybrid";

type JobDraft = {
  title: string;
  location: string;
  type: JobType;
  description: string;
  tags: string;
  salaryMin: string;
  salaryMax: string;
};

export default function EmployerJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId as Id<"jobs">;
  const { organization } = useOrganization();
  const bootstrap = useOrganizationBootstrap(organization);
  const updateApplicationStatus = useMutation(api.orgs.updateApplicationStatus);
  const updateJob = useMutation(api.orgs.updateJob);
  const setJobPublished = useMutation(api.orgs.setJobPublished);
  const [editing, setEditing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobSaving, setJobSaving] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const [draft, setDraft] = useState<JobDraft | null>(null);

  const data = useQuery(
    api.orgs.getOrgJobWithApplicants,
    jobId && bootstrap.clerkOrgId && bootstrap.ready
      ? { jobId, clerkOrgId: bootstrap.clerkOrgId }
      : "skip",
  );

  if (!bootstrap.clerkOrgId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Select an organization to view this role.</p>
      </main>
    );
  }

  if (bootstrap.status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-amber-700">
          Workspace initialization failed ({bootstrap.error}).{" "}
          <Link href="/onboarding" className="underline hover:no-underline">
            Re-run onboarding sync
          </Link>
          .
        </p>
      </main>
    );
  }

  if (bootstrap.status === "loading") {
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

  const { job, applications } = data;
  const canManageJob = bootstrap.role !== "viewer";
  const jobDraft =
    draft ?? toJobDraft(job.title, job.location, job.type, job.description, job.tags, job.salaryMin, job.salaryMax);

  const onSaveJob = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bootstrap.clerkOrgId || !canManageJob || jobSaving) return;

    setJobSaving(true);
    setJobError(null);
    try {
      await updateJob({
        clerkOrgId: bootstrap.clerkOrgId,
        jobId,
        title: jobDraft.title,
        location: jobDraft.location,
        type: jobDraft.type,
        description: jobDraft.description,
        tags: jobDraft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        salaryMin: jobDraft.salaryMin ? Number(jobDraft.salaryMin) : undefined,
        salaryMax: jobDraft.salaryMax ? Number(jobDraft.salaryMax) : undefined,
      });
      setEditing(false);
      setDraft(null);
    } catch (error: unknown) {
      setJobError(error instanceof Error ? error.message : "Failed to save job changes.");
    } finally {
      setJobSaving(false);
    }
  };

  const onTogglePublished = async () => {
    if (!bootstrap.clerkOrgId || !canManageJob || publishSaving) return;

    setPublishSaving(true);
    setJobError(null);
    try {
      await setJobPublished({
        clerkOrgId: bootstrap.clerkOrgId,
        jobId,
        published: !job.published,
      });
    } catch (error: unknown) {
      setJobError(error instanceof Error ? error.message : "Failed to update publish status.");
    } finally {
      setPublishSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Role</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {job.location} • {readableType(job.type)}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {job.published ? "Published" : "Unpublished"}
            </span>
            {job.salaryMin || job.salaryMax ? (
              <span className="text-xs text-slate-500">
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </span>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5 text-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">Role details</p>
              {canManageJob ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing((current) => !current);
                      setDraft(
                        toJobDraft(
                          job.title,
                          job.location,
                          job.type,
                          job.description,
                          job.tags,
                          job.salaryMin,
                          job.salaryMax,
                        ),
                      );
                      setJobError(null);
                    }}
                    className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  >
                    {editing ? "Close editor" : "Edit job"}
                  </button>
                  <button
                    type="button"
                    disabled={publishSaving}
                    onClick={onTogglePublished}
                    className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium disabled:opacity-60"
                  >
                    {publishSaving
                      ? "Saving…"
                      : job.published
                        ? "Unpublish job"
                        : "Publish job"}
                  </button>
                </div>
              ) : null}
            </div>

            {editing && canManageJob ? (
              <form onSubmit={onSaveJob} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Job title
                    </span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                      value={jobDraft.title}
                      onChange={(e) => setDraft({ ...jobDraft, title: e.target.value })}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Location
                    </span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                      value={jobDraft.location}
                      onChange={(e) => setDraft({ ...jobDraft, location: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Employment type
                  </span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                    value={jobDraft.type}
                    onChange={(e) => setDraft({ ...jobDraft, type: e.target.value as JobType })}
                  >
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Description
                  </span>
                  <textarea
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                    rows={6}
                    value={jobDraft.description}
                    onChange={(e) => setDraft({ ...jobDraft, description: e.target.value })}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Tags (comma separated)
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                    value={jobDraft.tags}
                    onChange={(e) => setDraft({ ...jobDraft, tags: e.target.value })}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Salary min
                    </span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                      type="number"
                      min="0"
                      value={jobDraft.salaryMin}
                      onChange={(e) => setDraft({ ...jobDraft, salaryMin: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Salary max
                    </span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background px-2 py-1.5"
                      type="number"
                      min="0"
                      value={jobDraft.salaryMax}
                      onChange={(e) => setDraft({ ...jobDraft, salaryMax: e.target.value })}
                    />
                  </label>
                </div>

                {jobError ? (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{jobError}</p>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={jobSaving}
                    className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-60"
                  >
                    {jobSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {job.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
                  <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {job.description}
                  </p>
                </div>
                {jobError ? (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{jobError}</p>
                ) : null}
              </>
            )}
          </article>

          <aside className="space-y-4">
            {bootstrap.role === "viewer" ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">
                  You have viewer access. You can review applicants but cannot update application
                  statuses.
                </p>
              </div>
            ) : null}
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
                          disabled={bootstrap.role === "viewer"}
                          onChange={async (e) => {
                            if (!bootstrap.clerkOrgId || bootstrap.role === "viewer") return;
                            setStatusError(null);
                            try {
                              await updateApplicationStatus({
                                clerkOrgId: bootstrap.clerkOrgId,
                                jobId,
                                applicationId: app._id,
                                status: e.target.value as ApplicationStatus,
                              });
                            } catch (error: unknown) {
                              setStatusError(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to update application status.",
                              );
                            }
                          }}
                        >
                          <option value="applied">Applied</option>
                          <option value="in_review">In review</option>
                          <option value="interview">Interviewing</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      {app.resumeText ? (
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          {app.resumeText}
                        </p>
                      ) : null}
                      {app.coverLetter ? (
                        <p className="mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                          {app.coverLetter}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {statusError ? (
                <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{statusError}</p>
              ) : null}
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

function toJobDraft(
  title: string,
  location: string,
  type: JobType,
  description: string,
  tags: string[],
  salaryMin: number | undefined,
  salaryMax: number | undefined,
): JobDraft {
  return {
    title,
    location,
    type,
    description,
    tags: tags.join(", "),
    salaryMin: salaryMin?.toString() ?? "",
    salaryMax: salaryMax?.toString() ?? "",
  };
}
