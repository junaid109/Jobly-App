"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type BootstrapRole = "admin" | "recruiter" | "viewer";

type BootstrapState =
  | {
      orgId: string;
      status: "ready";
      role: BootstrapRole;
      error: null;
    }
  | {
      orgId: string;
      status: "error";
      role: null;
      error: string;
    }
  | null;

export function useOrganizationBootstrap(
  organization: { id: string; name: string } | null | undefined,
) {
  const bootstrapOrganizationAccess = useMutation(api.orgs.bootstrapOrganizationAccess);
  const repairMyOrgRole = useMutation(api.orgs.repairMyOrgRole);
  const [state, setState] = useState<BootstrapState>(null);
  const requestVersionRef = useRef(0);

  const orgId = organization?.id ?? null;
  const orgName = organization?.name ?? null;

  useEffect(() => {
    if (!orgId || !orgName) {
      return;
    }

    if (state?.orgId === orgId) {
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    let cancelled = false;

    void bootstrapOrganizationAccess({
      clerkOrgId: orgId,
      name: orgName,
    })
      .then(async (result) => {
        const repaired = await repairMyOrgRole({ clerkOrgId: orgId });
        const role = repaired.repaired ? repaired.newRole : result.role;
        if (cancelled || requestVersionRef.current !== requestVersion) {
          return;
        }
        setState({
          orgId,
          status: "ready",
          role,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled || requestVersionRef.current !== requestVersion) {
          return;
        }
        setState({
          orgId,
          status: "error",
          role: null,
          error:
            error instanceof Error ? error.message : "Failed to sync organization workspace.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrapOrganizationAccess, orgId, orgName, repairMyOrgRole, state?.orgId]);

  return useMemo(() => {
    if (!orgId) {
      return {
        clerkOrgId: null,
        status: "idle" as const,
        role: null,
        error: null,
        ready: false,
      };
    }

    if (!state || state.orgId !== orgId) {
      return {
        clerkOrgId: orgId,
        status: "loading" as const,
        role: null,
        error: null,
        ready: false,
      };
    }

    return {
      clerkOrgId: orgId,
      status: state.status,
      role: state.role,
      error: state.error,
      ready: state.status === "ready",
    };
  }, [orgId, state]);
}
