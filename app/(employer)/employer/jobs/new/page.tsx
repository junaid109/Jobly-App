"use client";

import { useState } from "react";
import { useOrganization, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const { organization } = useOrganization();
  const createJob = useMutation(api.orgs.createJob);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"full_time" | "part_time" | "contract" | "internship" | "remote" | "hybrid">("full_time");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || submitting) return;
    setSubmitting(true);
    try {
      const jobId = await createJob({
        clerkOrgId: organization.id,
        title,
        location,
        type,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        salaryMin: undefined,
        salaryMax: undefined,
      });
      router.push(`/employer/jobs/${jobId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Post a new role
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Create a job posting for your organization. You can refine the details later.
          </p>
        </header>

        <SignedOut>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Sign in and select a Clerk Organization to post a role.
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
              Choose an organization via the Clerk organization switcher to post on its behalf.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Job title
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Location
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote, London, NYC"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Employment type
                </span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
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
                  className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tags (comma separated)
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm px-2 py-1.5"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. product, design, senior"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-60"
                >
                  {submitting ? "Publishing…" : "Publish job"}
                </button>
              </div>
            </form>
          )}
        </SignedIn>
      </div>
    </main>
  );
}
