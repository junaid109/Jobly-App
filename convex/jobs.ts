import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Public job listing for seekers
export const listPublicJobs = query({
  args: {
    keyword: v.optional(v.string()),
    location: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    remoteOnly: v.optional(v.boolean()),
    minSalary: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("salary"))),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .collect();

    const organizations = await ctx.db
      .query("organizations")
      .collect();

    const orgById = new Map(organizations.map((org) => [org._id, org]));

    const normalizedKeyword = args.keyword?.trim().toLowerCase();
    const normalizedLocation = args.location?.trim().toLowerCase();
    const requestedTypes = new Set(args.types ?? []);

    const filteredJobs = jobs.filter((job) => {
      if (normalizedKeyword) {
        const haystack = [job.title, job.description, job.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedKeyword)) {
          return false;
        }
      }

      if (normalizedLocation && !job.location.toLowerCase().includes(normalizedLocation)) {
        return false;
      }

      if (requestedTypes.size > 0 && !requestedTypes.has(job.type)) {
        return false;
      }

      if (
        args.remoteOnly &&
        job.type !== "remote" &&
        !job.location.toLowerCase().includes("remote")
      ) {
        return false;
      }

      if (args.minSalary !== undefined) {
        const comparableSalary = job.salaryMax ?? job.salaryMin;
        if (comparableSalary === undefined || comparableSalary < args.minSalary) {
          return false;
        }
      }

      return true;
    });

    const sortedJobs = filteredJobs.sort((a, b) => {
      if (args.sortBy === "salary") {
        const salaryA = a.salaryMax ?? a.salaryMin ?? 0;
        const salaryB = b.salaryMax ?? b.salaryMin ?? 0;
        if (salaryA !== salaryB) {
          return salaryB - salaryA;
        }
      }

      return b.createdAt - a.createdAt;
    });

    return sortedJobs.slice(0, 50).map((job) => {
      const org = orgById.get(job.organizationId);
      return {
        _id: job._id,
        title: job.title,
        location: job.location,
        type: job.type,
        tags: job.tags,
        createdAt: job.createdAt,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        organizationName: org?.name ?? "Unknown company",
      };
    });
  },
});

export const getJob = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || !job.published) {
      return null;
    }
    const org = await ctx.db.get(job.organizationId);
    return {
      ...job,
      organizationName: org?.name ?? "Unknown company",
    };
  },
});

// Seeker applications
export const listMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const apps = await ctx.db
      .query("applications")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .order("desc")
      .take(50);

    const jobIds = apps.map((a) => a.jobId);
    const jobs = await Promise.all(jobIds.map((id) => ctx.db.get(id)));

    return apps.map((app, i) => ({
      ...app,
      job: jobs[i],
    }));
  },
});

export const applyToJob = mutation({
  args: {
    jobId: v.id("jobs"),
    resumeText: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job || !job.published) {
      throw new Error("Job is not available");
    }

    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_job_and_seeker", (q) =>
        q.eq("jobId", args.jobId).eq("seekerUserId", identity.subject),
      )
      .unique();

    if (existingApplication) {
      throw new Error("You have already applied to this job.");
    }

    const now = Date.now();
    await ctx.db.insert("applications", {
      jobId: args.jobId,
      seekerUserId: identity.subject,
      resumeUrl: undefined,
      resumeText: args.resumeText,
      coverLetter: args.coverLetter,
      status: "applied",
      createdAt: now,
      updatedAt: now,
    });
  },
});
