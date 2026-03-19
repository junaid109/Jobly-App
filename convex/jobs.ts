import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_PUBLIC_JOB_RESULTS = 50;
const MAX_PUBLIC_JOB_SCAN = 200;
const PROFILE_COMPLETION_FIELDS = [
  "name",
  "headline",
  "location",
  "skills",
  "experience",
  "desiredTitle",
  "workPreference",
  "summary",
  "resumeUrl",
  "linkedinUrl",
  "portfolioUrl",
] as const;

const applicationStatusValidator = v.union(
  v.literal("applied"),
  v.literal("in_review"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("rejected"),
);
const applicationStatusHistoryItemValidator = v.object({
  status: applicationStatusValidator,
  changedAt: v.number(),
  changedBy: v.union(v.literal("seeker"), v.literal("employer"), v.literal("system")),
});
const seekerProfileValidator = v.object({
  _id: v.id("profiles"),
  seekerUserId: v.string(),
  name: v.string(),
  headline: v.string(),
  location: v.string(),
  skills: v.array(v.string()),
  experience: v.optional(v.string()),
  desiredTitle: v.optional(v.string()),
  workPreference: v.optional(
    v.union(
      v.literal("onsite"),
      v.literal("hybrid"),
      v.literal("remote"),
      v.literal("flexible"),
    ),
  ),
  summary: v.optional(v.string()),
  resumeUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  portfolioUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});
const seekerProfileSummaryValidator = v.object({
  profile: v.union(seekerProfileValidator, v.null()),
  completionPercent: v.number(),
  completedFields: v.number(),
  totalFields: v.number(),
  missingFields: v.array(v.string()),
});

const publicJobResultValidator = v.object({
  _id: v.id("jobs"),
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
  tags: v.array(v.string()),
  createdAt: v.number(),
  salaryMin: v.optional(v.number()),
  salaryMax: v.optional(v.number()),
  organizationName: v.string(),
});
const savedJobListItemValidator = v.object({
  _id: v.id("savedJobs"),
  jobId: v.id("jobs"),
  createdAt: v.number(),
  job: v.union(publicJobResultValidator, v.null()),
});
const jobAlertValidator = v.object({
  _id: v.id("jobAlerts"),
  keyword: v.optional(v.string()),
  location: v.optional(v.string()),
  types: v.array(v.string()),
  remoteOnly: v.boolean(),
  minSalary: v.optional(v.number()),
  createdAt: v.number(),
});
const applicationListItemValidator = v.object({
  _id: v.id("applications"),
  jobId: v.id("jobs"),
  organizationId: v.optional(v.id("organizations")),
  seekerUserId: v.string(),
  resumeUrl: v.optional(v.string()),
  resumeText: v.optional(v.string()),
  coverLetter: v.optional(v.string()),
  status: applicationStatusValidator,
  statusHistory: v.array(applicationStatusHistoryItemValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
  job: v.union(
    v.object({
      _id: v.id("jobs"),
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
      salaryMin: v.optional(v.number()),
      salaryMax: v.optional(v.number()),
      createdAt: v.number(),
      organizationName: v.string(),
    }),
    v.null(),
  ),
});

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSkills(skills: string[]) {
  return [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];
}

function calculateProfileCompletion(profile: {
  name: string;
  headline: string;
  location: string;
  skills: string[];
  experience?: string;
  desiredTitle?: string;
  workPreference?: string;
  summary?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
} | null) {
  if (!profile) {
    return {
      completionPercent: 0,
      completedFields: 0,
      totalFields: PROFILE_COMPLETION_FIELDS.length,
      missingFields: [...PROFILE_COMPLETION_FIELDS],
    };
  }

  const fieldChecks: Record<(typeof PROFILE_COMPLETION_FIELDS)[number], boolean> = {
    name: Boolean(profile.name.trim()),
    headline: Boolean(profile.headline.trim()),
    location: Boolean(profile.location.trim()),
    skills: profile.skills.length > 0,
    experience: Boolean(profile.experience?.trim()),
    desiredTitle: Boolean(profile.desiredTitle?.trim()),
    workPreference: Boolean(profile.workPreference),
    summary: Boolean(profile.summary?.trim()),
    resumeUrl: Boolean(profile.resumeUrl?.trim()),
    linkedinUrl: Boolean(profile.linkedinUrl?.trim()),
    portfolioUrl: Boolean(profile.portfolioUrl?.trim()),
  };

  const completedFields = PROFILE_COMPLETION_FIELDS.filter((field) => fieldChecks[field]).length;
  const missingFields = PROFILE_COMPLETION_FIELDS.filter((field) => !fieldChecks[field]);

  return {
    completionPercent: Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100),
    completedFields,
    totalFields: PROFILE_COMPLETION_FIELDS.length,
    missingFields,
  };
}

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
  returns: v.array(publicJobResultValidator),
  handler: async (ctx, args) => {
    const organizations = await ctx.db
      .query("organizations")
      .collect();

    const orgById = new Map(organizations.map((org) => [org._id, org]));

    const normalizedKeyword = args.keyword?.trim().toLowerCase();
    const normalizedLocation = args.location?.trim().toLowerCase();
    const requestedTypes = new Set(args.types ?? []);
    const filteredJobs = [];
    let scannedJobs = 0;

    for await (const job of ctx.db
      .query("jobs")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")) {
      scannedJobs += 1;
      if (scannedJobs > MAX_PUBLIC_JOB_SCAN) {
        break;
      }

      if (normalizedKeyword) {
        const haystack = [job.title, job.description, job.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedKeyword)) {
          continue;
        }
      }

      if (normalizedLocation && !job.location.toLowerCase().includes(normalizedLocation)) {
        continue;
      }

      if (requestedTypes.size > 0 && !requestedTypes.has(job.type)) {
        continue;
      }

      if (
        args.remoteOnly &&
        job.type !== "remote" &&
        !job.location.toLowerCase().includes("remote")
      ) {
        continue;
      }

      if (args.minSalary !== undefined) {
        const comparableSalary = job.salaryMax ?? job.salaryMin;
        if (comparableSalary === undefined || comparableSalary < args.minSalary) {
          continue;
        }
      }

      filteredJobs.push(job);

      if (args.sortBy !== "salary" && filteredJobs.length >= MAX_PUBLIC_JOB_RESULTS) {
        break;
      }
    }

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

    return sortedJobs.slice(0, MAX_PUBLIC_JOB_RESULTS).map((job) => {
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

export const listRelatedJobs = query({
  args: {
    jobId: v.id("jobs"),
  },
  returns: v.array(publicJobResultValidator),
  handler: async (ctx, args) => {
    const currentJob = await ctx.db.get(args.jobId);
    if (!currentJob || !currentJob.published) {
      return [];
    }

    const organizations = await ctx.db
      .query("organizations")
      .collect();
    const orgById = new Map(organizations.map((org) => [org._id, org]));

    const relatedJobs = [];
    let scannedJobs = 0;

    for await (const job of ctx.db
      .query("jobs")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")) {
      scannedJobs += 1;
      if (scannedJobs > 100 || relatedJobs.length >= 4) {
        break;
      }

      if (job._id === args.jobId) {
        continue;
      }

      const sharedTags = job.tags.filter((tag) => currentJob.tags.includes(tag)).length;
      const sameType = job.type === currentJob.type;
      const sameOrganization = job.organizationId === currentJob.organizationId;

      if (!sameType && !sameOrganization && sharedTags === 0) {
        continue;
      }

      relatedJobs.push({
        _id: job._id,
        title: job.title,
        location: job.location,
        type: job.type,
        tags: job.tags,
        createdAt: job.createdAt,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        organizationName: orgById.get(job.organizationId)?.name ?? "Unknown company",
      });
    }

    return relatedJobs;
  },
});

// Seeker applications
export const listMyApplications = query({
  args: {},
  returns: v.array(applicationListItemValidator),
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
    const organizationIds = [...new Set(jobs.flatMap((job) => (job ? [job.organizationId] : [])))];
    const organizations = await Promise.all(organizationIds.map((orgId) => ctx.db.get(orgId)));
    const orgById = new Map(
      organizations.filter((org) => org !== null).map((org) => [org._id, org]),
    );

    return apps.map((app, index) => {
      const job = jobs[index];
      return {
        _id: app._id,
        jobId: app.jobId,
        organizationId: app.organizationId,
        seekerUserId: app.seekerUserId,
        resumeUrl: app.resumeUrl,
        resumeText: app.resumeText,
        coverLetter: app.coverLetter,
        status: app.status,
        statusHistory: app.statusHistory ?? [
          {
            status: app.status,
            changedAt: app.updatedAt,
            changedBy: "system",
          },
        ],
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        job: job
          ? {
              _id: job._id,
              title: job.title,
              location: job.location,
              type: job.type,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              createdAt: job.createdAt,
              organizationName: orgById.get(job.organizationId)?.name ?? "Unknown company",
            }
          : null,
      };
    });
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
      organizationId: job.organizationId,
      seekerUserId: identity.subject,
      resumeUrl: undefined,
      resumeText: args.resumeText,
      coverLetter: args.coverLetter,
      status: "applied",
      statusHistory: [
        {
          status: "applied",
          changedAt: now,
          changedBy: "seeker",
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getMyProfile = query({
  args: {},
  returns: seekerProfileSummaryValidator,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .unique();

    return {
      profile,
      ...calculateProfileCompletion(profile),
    };
  },
});

export const upsertMyProfile = mutation({
  args: {
    name: v.string(),
    headline: v.string(),
    location: v.string(),
    skills: v.array(v.string()),
    experience: v.optional(v.string()),
    desiredTitle: v.optional(v.string()),
    workPreference: v.optional(
      v.union(
        v.literal("onsite"),
        v.literal("hybrid"),
        v.literal("remote"),
        v.literal("flexible"),
      ),
    ),
    summary: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  },
  returns: seekerProfileSummaryValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .unique();

    const now = Date.now();
    const profileData = {
      seekerUserId: identity.subject,
      name: args.name.trim(),
      headline: args.headline.trim(),
      location: args.location.trim(),
      skills: normalizeSkills(args.skills),
      experience: normalizeOptionalText(args.experience),
      desiredTitle: normalizeOptionalText(args.desiredTitle),
      workPreference: args.workPreference,
      summary: normalizeOptionalText(args.summary),
      resumeUrl: normalizeOptionalText(args.resumeUrl),
      linkedinUrl: normalizeOptionalText(args.linkedinUrl),
      portfolioUrl: normalizeOptionalText(args.portfolioUrl),
      updatedAt: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
    } else {
      await ctx.db.insert("profiles", {
        ...profileData,
        createdAt: now,
      });
    }

    const nextProfile = await ctx.db
      .query("profiles")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .unique();

    return {
      profile: nextProfile,
      ...calculateProfileCompletion(nextProfile),
    };
  },
});

export const listSavedJobIds = query({
  args: {},
  returns: v.array(v.id("jobs")),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const savedJobs = await ctx.db
      .query("savedJobs")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .order("desc")
      .take(100);

    return savedJobs.map((savedJob) => savedJob.jobId);
  },
});

export const listSavedJobs = query({
  args: {},
  returns: v.array(savedJobListItemValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const savedJobs = await ctx.db
      .query("savedJobs")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .order("desc")
      .take(100);

    const jobIds = savedJobs.map((savedJob) => savedJob.jobId);
    const jobs = await Promise.all(jobIds.map((jobId) => ctx.db.get(jobId)));
    const organizationIds = [...new Set(jobs.flatMap((job) => (job ? [job.organizationId] : [])))];
    const organizations = await Promise.all(organizationIds.map((orgId) => ctx.db.get(orgId)));
    const orgById = new Map(
      organizations
        .filter((org) => org !== null)
        .map((org) => [org._id, org]),
    );

    return savedJobs.map((savedJob, index) => {
      const job = jobs[index];
      return {
        _id: savedJob._id,
        jobId: savedJob.jobId,
        createdAt: savedJob.createdAt,
        job: job
          ? {
              _id: job._id,
              title: job.title,
              location: job.location,
              type: job.type,
              tags: job.tags,
              createdAt: job.createdAt,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              organizationName: orgById.get(job.organizationId)?.name ?? "Unknown company",
            }
          : null,
      };
    });
  },
});

export const saveJob = mutation({
  args: {
    jobId: v.id("jobs"),
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

    const existingSavedJob = await ctx.db
      .query("savedJobs")
      .withIndex("by_job_and_seeker", (q) =>
        q.eq("jobId", args.jobId).eq("seekerUserId", identity.subject),
      )
      .unique();

    if (existingSavedJob) {
      return { ok: true };
    }

    await ctx.db.insert("savedJobs", {
      jobId: args.jobId,
      seekerUserId: identity.subject,
      createdAt: Date.now(),
    });

    return { ok: true };
  },
});

export const unsaveJob = mutation({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingSavedJob = await ctx.db
      .query("savedJobs")
      .withIndex("by_job_and_seeker", (q) =>
        q.eq("jobId", args.jobId).eq("seekerUserId", identity.subject),
      )
      .unique();

    if (!existingSavedJob) {
      return { ok: true };
    }

    await ctx.db.delete(existingSavedJob._id);
    return { ok: true };
  },
});

export const listJobAlerts = query({
  args: {},
  returns: v.array(jobAlertValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const alerts = await ctx.db
      .query("jobAlerts")
      .withIndex("by_seeker", (q) => q.eq("seekerUserId", identity.subject))
      .order("desc")
      .take(100);

    return alerts.map((alert) => ({
      _id: alert._id,
      keyword: alert.keyword,
      location: alert.location,
      types: alert.types,
      remoteOnly: alert.remoteOnly,
      minSalary: alert.minSalary,
      createdAt: alert.createdAt,
    }));
  },
});

export const createJobAlert = mutation({
  args: {
    keyword: v.optional(v.string()),
    location: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    remoteOnly: v.optional(v.boolean()),
    minSalary: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.insert("jobAlerts", {
      seekerUserId: identity.subject,
      keyword: args.keyword,
      location: args.location,
      types: args.types ?? [],
      remoteOnly: args.remoteOnly ?? false,
      minSalary: args.minSalary,
      createdAt: Date.now(),
    });

    return { ok: true };
  },
});

export const deleteJobAlert = mutation({
  args: {
    alertId: v.id("jobAlerts"),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.seekerUserId !== identity.subject) {
      throw new Error("Alert not found");
    }

    await ctx.db.delete(args.alertId);
    return { ok: true };
  },
});
