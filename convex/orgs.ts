import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Resolve or create an organizations row for a Clerk Organization
export const ensureOrganization = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (existing) return existing._id;

    const orgId = await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      createdAt: Date.now(),
    });
    return orgId;
  },
});

// Upsert an org member and role for a Clerk user
export const upsertOrgMember = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    clerkUserId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("recruiter"),
      v.literal("viewer"),
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await ctx.runMutation(
      // self-call to reuse logic
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      ensureOrganization,
      { clerkOrgId: args.clerkOrgId, name: args.name },
    );

    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("organizationId"), orgId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return { organizationId: orgId, role: args.role };
    }

    await ctx.db.insert("orgMembers", {
      organizationId: orgId,
      clerkUserId: args.clerkUserId,
      role: args.role,
      createdAt: now,
    });
    return { organizationId: orgId, role: args.role };
  },
});

// Get summary for employer dashboard
export const getOrgDashboard = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!org) return null;

    const [jobs, applications] = await Promise.all([
      ctx.db
        .query("jobs")
        .withIndex("by_org", (q) => q.eq("organizationId", org._id))
        .collect(),
      ctx.db
        .query("applications")
        .collect(),
    ]);

    const orgJobIds = new Set(jobs.map((j) => j._id));
    const orgApplications = applications.filter((a) => orgJobIds.has(a.jobId));

    return {
      organization: org,
      stats: {
        openJobs: jobs.filter((j) => j.published).length,
        totalJobs: jobs.length,
        totalApplicants: orgApplications.length,
      },
    };
  },
});

// Org-scoped job listing and CRUD
export const listOrgJobs = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!org) return [];
    return await ctx.db
      .query("jobs")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .order("desc")
      .collect();
  },
});

export const createJob = mutation({
  args: {
    clerkOrgId: v.string(),
    title: v.string(),
    location: v.string(),
    type: v.union(
      v.literal("full_time"),
      v.literal("part_time"),
      v.literal("contract"),
      v.literal("internship"),
      v.literal("remote"),
      v.literal("hybrid"),
    ),
    description: v.string(),
    tags: v.array(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();
    if (!org) {
      throw new Error("Organization not found");
    }
    const now = Date.now();
    return await ctx.db.insert("jobs", {
      organizationId: org._id,
      title: args.title,
      location: args.location,
      type: args.type,
      description: args.description,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      tags: args.tags,
      published: true,
      createdAt: now,
    });
  },
});

export const getOrgJobWithApplicants = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .order("desc")
      .collect();
    return { job, applications };
  },
});

