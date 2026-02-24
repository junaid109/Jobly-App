import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // B2B employer organizations, mirrored from Clerk Organizations
  organizations: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    createdAt: v.number(),
    planTier: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    ),
    billingStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("inactive"),
      ),
    ),
    trialEndsAt: v.optional(v.number()),
  }).index("by_clerkOrgId", ["clerkOrgId"]),

  // Organization members and roles
  orgMembers: defineTable({
    organizationId: v.id("organizations"),
    clerkUserId: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("recruiter"),
      v.literal("viewer"),
    ),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["clerkUserId"]),

  // Public and org-scoped job postings
  jobs: defineTable({
    organizationId: v.id("organizations"),
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
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    tags: v.array(v.string()),
    published: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_published", ["published", "createdAt"]),

  // Candidate applications to jobs
  applications: defineTable({
    jobId: v.id("jobs"),
    seekerUserId: v.string(), // Clerk user id
    resumeUrl: v.optional(v.string()),
    resumeText: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
    status: v.union(
      v.literal("applied"),
      v.literal("in_review"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_seeker", ["seekerUserId"]),

  // Candidate profiles for seekers
  profiles: defineTable({
    seekerUserId: v.string(),
    name: v.string(),
    headline: v.string(),
    location: v.string(),
    skills: v.array(v.string()),
    experience: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_seeker", ["seekerUserId"]),
});
