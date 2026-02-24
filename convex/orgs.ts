import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getActiveJobLimitForOrganization } from "./billing";

type OrgRole = "admin" | "recruiter" | "viewer";

const ROLE_PRIORITY: Record<OrgRole, number> = {
  viewer: 1,
  recruiter: 2,
  admin: 3,
};

function toOrgRole(value: string | null | undefined): OrgRole {
  if (!value) return "viewer";
  if (value.includes("admin")) return "admin";
  if (value.includes("recruiter")) return "recruiter";
  return "viewer";
}

function getIdentityClaim(identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>, key: string): string | undefined {
  const record = identity as unknown as Record<string, unknown>;
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

async function resolveOrganizationByClerkId(ctx: QueryCtx | MutationCtx, clerkOrgId: string) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
    .unique();
}

async function requireOrgAccess(
  ctx: QueryCtx | MutationCtx,
  clerkOrgId: string,
  minimumRole: OrgRole = "viewer",
): Promise<{ organization: Doc<"organizations">; role: OrgRole; clerkUserId: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const organization = await resolveOrganizationByClerkId(ctx, clerkOrgId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  const clerkUserId = identity.subject;
  const membership = await ctx.db
    .query("orgMembers")
    .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
    .filter((q) => q.eq(q.field("organizationId"), organization._id))
    .unique();

  let role: OrgRole;
  if (membership) {
    role = membership.role;
  } else {
    const orgIdClaim =
      getIdentityClaim(identity, "org_id") ?? getIdentityClaim(identity, "organization_id");
    const orgRoleClaim =
      getIdentityClaim(identity, "org_role") ?? getIdentityClaim(identity, "organization_role");

    if (orgIdClaim !== clerkOrgId || !orgRoleClaim) {
      throw new Error("Forbidden");
    }

    role = toOrgRole(orgRoleClaim);
  }

  if (ROLE_PRIORITY[role] < ROLE_PRIORITY[minimumRole]) {
    throw new Error("Forbidden");
  }

  return { organization, role, clerkUserId };
}

export const ensureOrganization = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await resolveOrganizationByClerkId(ctx, args.clerkOrgId);
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      createdAt: Date.now(),
      planTier: "free",
      billingStatus: "inactive",
    });
  },
});

export const upsertOrgMember = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    clerkUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("recruiter"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const existingOrg = await resolveOrganizationByClerkId(ctx, args.clerkOrgId);
    const orgId: Id<"organizations"> = existingOrg
      ? existingOrg._id
      : await ctx.db.insert("organizations", {
          clerkOrgId: args.clerkOrgId,
          name: args.name,
          createdAt: Date.now(),
          planTier: "free",
          billingStatus: "inactive",
        });

    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .filter((q) => q.eq(q.field("organizationId"), orgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return { organizationId: orgId, role: args.role };
    }

    await ctx.db.insert("orgMembers", {
      organizationId: orgId,
      clerkUserId: args.clerkUserId,
      role: args.role,
      createdAt: Date.now(),
    });

    return { organizationId: orgId, role: args.role };
  },
});

export const getOrgDashboard = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAccess(ctx, args.clerkOrgId, "viewer");

    const [jobs, applications] = await Promise.all([
      ctx.db
        .query("jobs")
        .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
        .collect(),
      ctx.db.query("applications").collect(),
    ]);

    const orgJobIds = new Set(jobs.map((j) => j._id));
    const orgApplications = applications.filter((a) => orgJobIds.has(a.jobId));

    return {
      organization,
      stats: {
        openJobs: jobs.filter((j) => j.published).length,
        totalJobs: jobs.length,
        totalApplicants: orgApplications.length,
      },
    };
  },
});

export const listOrgJobs = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAccess(ctx, args.clerkOrgId, "viewer");

    return await ctx.db
      .query("jobs")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
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
    const { organization } = await requireOrgAccess(ctx, args.clerkOrgId, "recruiter");

    const publishedJobs = await ctx.db
      .query("jobs")
      .withIndex("by_org", (q) => q.eq("organizationId", organization._id))
      .collect();

    const activeJobCount = publishedJobs.filter((job) => job.published).length;
    const activeJobLimit = getActiveJobLimitForOrganization(organization);

    if (activeJobCount >= activeJobLimit) {
      throw new Error("Plan limit reached. Upgrade to post more active jobs.");
    }

    return await ctx.db.insert("jobs", {
      organizationId: organization._id,
      title: args.title,
      location: args.location,
      type: args.type,
      description: args.description,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      tags: args.tags,
      published: true,
      createdAt: Date.now(),
    });
  },
});

export const getOrgJobWithApplicants = query({
  args: {
    clerkOrgId: v.string(),
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAccess(ctx, args.clerkOrgId, "viewer");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.organizationId !== organization._id) {
      throw new Error("Forbidden");
    }

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .order("desc")
      .collect();

    return { job, applications };
  },
});

export const updateApplicationStatus = mutation({
  args: {
    clerkOrgId: v.string(),
    jobId: v.id("jobs"),
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("applied"),
      v.literal("in_review"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAccess(ctx, args.clerkOrgId, "recruiter");

    const job = await ctx.db.get(args.jobId);
    if (!job || job.organizationId !== organization._id) {
      throw new Error("Forbidden");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.jobId !== job._id) {
      throw new Error("Application not found");
    }

    await ctx.db.patch(application._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});
