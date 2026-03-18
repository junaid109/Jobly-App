"use client";

import { useEffect, useState } from "react";
import {
  CreateOrganization,
  SignedIn,
  SignedOut,
  SignInButton,
  useOrganization,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useOrganizationBootstrap } from "@/components/useOrganizationBootstrap";

type RoleChoice = "job_seeker" | "employer";

export default function OnboardingPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const bootstrap = useOrganizationBootstrap(organization);
  const [choice, setChoice] = useState<RoleChoice | null>(null);

  useEffect(() => {
    if (choice !== "employer" || bootstrap.status !== "ready") {
      return;
    }

    router.replace("/employer/dashboard");
  }, [bootstrap.status, choice, router]);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Set up your Jobly account
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Choose how you want to use Jobly today. You can always use both experiences later.
          </p>
        </header>

        <SignedOut>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Sign in to continue onboarding.
            </p>
            <SignInButton mode="modal">
              <button className="px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <section className="grid gap-4 md:grid-cols-2">
            <button
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => {
                setChoice("job_seeker");
                router.push("/jobs");
              }}
            >
              <p className="text-xs font-medium text-slate-500">JOB SEEKER</p>
              <h2 className="text-lg font-semibold mt-1">Find and apply to roles</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Browse open jobs, submit applications, and track status updates in real time.
              </p>
            </button>

            <button
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => setChoice("employer")}
            >
              <p className="text-xs font-medium text-slate-500">EMPLOYER</p>
              <h2 className="text-lg font-semibold mt-1">Hire with your team</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Create or join an organization to manage jobs and applicants collaboratively.
              </p>
            </button>
          </section>

          {choice === "employer" && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-5 space-y-3">
              {organization ? (
                bootstrap.status === "error" ? (
                  <p className="text-sm text-amber-700">
                    We couldn&apos;t initialize this workspace ({bootstrap.error}).
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Syncing your organization membership...
                  </p>
                )
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Create your organization workspace to continue.
                  </p>
                  <CreateOrganization
                    afterCreateOrganizationUrl="/onboarding"
                    skipInvitationScreen={false}
                  />
                </>
              )}
            </div>
          )}
        </SignedIn>
      </div>
    </main>
  );
}
