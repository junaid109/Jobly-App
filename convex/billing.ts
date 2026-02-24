import type { Doc } from "./_generated/dataModel";

export type OrganizationPlanTier = "free" | "pro" | "enterprise";
export type OrganizationBillingStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive";

export const FREE_PLAN_ACTIVE_JOB_LIMIT = 3;

export function getOrganizationPlanTier(org: Doc<"organizations">): OrganizationPlanTier {
  return org.planTier ?? "free";
}

export function getActiveJobLimitForOrganization(org: Doc<"organizations">): number {
  const tier = getOrganizationPlanTier(org);
  if (tier === "enterprise") return 1000;
  if (tier === "pro") return 25;
  return FREE_PLAN_ACTIVE_JOB_LIMIT;
}
