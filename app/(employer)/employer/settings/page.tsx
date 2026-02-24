"use client";

import {
  OrganizationProfile,
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";

export default function EmployerSettingsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Organization settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Manage members, roles, and identity for your company workspace via Clerk Organizations.
            </p>
          </div>
          <SignedIn>
            <OrganizationSwitcher />
          </SignedIn>
        </header>

        <SignedOut>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Sign in to access organization management powered by Clerk Organizations.
            </p>
            <SignInButton mode="modal">
              <button className="px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium">
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 md:p-5">
            <OrganizationProfile />
          </div>
        </SignedIn>
      </div>
    </main>
  );
}

