"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "remote"
  | "hybrid";

const JOB_TYPE_OPTIONS: Array<{ label: string; value: JobType }> = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
];

const SALARY_OPTIONS = [
  { label: "$50k+", value: "50000" },
  { label: "$100k+", value: "100000" },
  { label: "$150k+", value: "150000" },
];

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const keyword = searchParams.get("q") ?? "";
  const location = searchParams.get("l") ?? "";
  const selectedTypes = searchParams.getAll("type") as JobType[];
  const remoteOnly = searchParams.get("remote") === "1";
  const minSalaryValue = searchParams.get("salary") ?? "";
  const sortBy = searchParams.get("sort") === "salary" ? "salary" : "newest";

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [locationInput, setLocationInput] = useState(location);

  const jobs =
    useQuery(api.jobs.listPublicJobs, {
      keyword: keyword || undefined,
      location: location || undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      remoteOnly: remoteOnly || undefined,
      minSalary: minSalaryValue ? Number(minSalaryValue) : undefined,
      sortBy,
    }) ?? [];

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams.toString());

    if (keywordInput.trim()) {
      nextParams.set("q", keywordInput.trim());
    } else {
      nextParams.delete("q");
    }

    if (locationInput.trim()) {
      nextParams.set("l", locationInput.trim());
    } else {
      nextParams.delete("l");
    }

    router.push(`/jobs?${nextParams.toString()}`);
  };

  const toggleType = (type: JobType) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const existing = new Set(nextParams.getAll("type"));
    if (existing.has(type)) {
      const filtered = nextParams.getAll("type").filter((value) => value !== type);
      nextParams.delete("type");
      filtered.forEach((value) => nextParams.append("type", value));
    } else {
      nextParams.append("type", type);
    }
    router.push(`/jobs?${nextParams.toString()}`);
  };

  const toggleRemoteOnly = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (remoteOnly) {
      nextParams.delete("remote");
    } else {
      nextParams.set("remote", "1");
    }
    router.push(`/jobs?${nextParams.toString()}`);
  };

  const setSalary = (value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set("salary", value);
    } else {
      nextParams.delete("salary");
    }
    router.push(`/jobs?${nextParams.toString()}`);
  };

  const setSort = (value: "newest" | "salary") => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", value);
    router.push(`/jobs?${nextParams.toString()}`);
  };

  const clearFilters = () => {
    router.push("/jobs");
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f4eb_0%,#f8fafc_28%,#ffffff_100%)] text-foreground px-5 py-8 md:px-8 md:py-10">
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] border border-stone-200/80 bg-white/90 backdrop-blur px-5 py-6 shadow-[0_24px_60px_-28px_rgba(41,37,36,0.28)] md:px-8">
          <div className="flex flex-col gap-6">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-amber-700 font-semibold">
                Search Jobs
              </p>
              <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-stone-900">
                Search roles the way candidates actually search.
              </h1>
              <p className="mt-3 text-sm md:text-base text-stone-600 max-w-2xl">
                Explore live jobs by keyword, city, work style, and pay range. This is the first
                step toward a stronger Indeed-style marketplace experience.
              </p>
            </div>

            <form
              onSubmit={onSearch}
              className="grid gap-3 rounded-[1.5rem] border border-stone-200 bg-stone-950 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
            >
              <label className="rounded-[1.15rem] bg-white px-4 py-3">
                <span className="block text-[11px] uppercase tracking-[0.16em] text-stone-500">
                  What
                </span>
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Job title, keyword, or skill"
                  className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />
              </label>
              <label className="rounded-[1.15rem] bg-white px-4 py-3">
                <span className="block text-[11px] uppercase tracking-[0.16em] text-stone-500">
                  Where
                </span>
                <input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City, region, or remote"
                  className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />
              </label>
              <button
                type="submit"
                className="rounded-[1.15rem] bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-300"
              >
                Search jobs
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(28,25,23,0.25)] h-fit">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Refine results</h2>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-stone-500 hover:text-stone-900"
              >
                Clear all
              </button>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500 font-semibold mb-3">
                Job type
              </p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPE_OPTIONS.map((option) => {
                  const active = selectedTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleType(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500 font-semibold mb-3">
                Work style
              </p>
              <button
                type="button"
                onClick={toggleRemoteOnly}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  remoteOnly
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-500"
                }`}
              >
                Remote only
              </button>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500 font-semibold mb-3">
                Salary floor
              </p>
              <div className="flex flex-wrap gap-2">
                {SALARY_OPTIONS.map((option) => {
                  const active = minSalaryValue === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSalary(active ? "" : option.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-amber-500 bg-amber-100 text-amber-900"
                          : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-30px_rgba(28,25,23,0.25)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Search by title, keywords, tags, location, work style, and salary range.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.16em] text-stone-500 font-semibold">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSort(e.target.value as "newest" | "salary")}
                  className="rounded-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800"
                >
                  <option value="newest">Newest</option>
                  <option value="salary">Highest salary</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {jobs.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
                  <p className="text-lg font-semibold text-stone-900">No jobs match these filters</p>
                  <p className="mt-2 text-sm text-stone-600">
                    Try widening your search, clearing filters, or browsing all live roles on Jobly.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    View all jobs
                  </button>
                </div>
              ) : (
                jobs.map((job) => (
                  <Link
                    key={job._id}
                    href={`/jobs/${job._id}`}
                    className="group block rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.25)] transition-all hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-[0_24px_60px_-34px_rgba(28,25,23,0.3)]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500 font-semibold">
                          {job.organizationName}
                        </p>
                        <h2 className="text-xl font-semibold text-stone-900 group-hover:text-amber-700">
                          {job.title}
                        </h2>
                        <p className="text-sm text-stone-600">
                          {job.location} • {readableType(job.type)}
                        </p>
                        {job.salaryMin || job.salaryMax ? (
                          <p className="text-sm font-medium text-stone-900">
                            {formatSalaryRange(job.salaryMin, job.salaryMax)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 md:max-w-52 md:justify-end">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                          New role
                        </span>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
                          {timeAgo(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    {job.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tags.slice(0, 5).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>
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

function timeAgo(createdAt: number) {
  const diffInDays = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
  if (diffInDays === 1) {
    return "1 day ago";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
}
