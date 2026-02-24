import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Public job listing for seekers
export const listPublicJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .take(50);

    const organizations = await ctx.db
      .query("organizations")
      .collect();

    const orgById = new Map(organizations.map((org) => [org._id, org]));

    return jobs.map((job) => {
      const org = orgById.get(job.organizationId);
      return {
        _id: job._id,
        title: job.title,
        location: job.location,
        type: job.type,
        tags: job.tags,
        createdAt: job.createdAt,
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

