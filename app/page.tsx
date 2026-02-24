import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">Jobly</span>
          <span className="hidden sm:inline text-xs text-slate-500">
            Modern hiring for teams &amp; talent
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="hover:text-primary transition-colors">
            Find jobs
          </Link>
          <Link href="/employer/dashboard" className="hover:text-primary transition-colors">
            For employers
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 rounded-md text-sm bg-foreground text-background hover:opacity-90">
                Get started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-8 py-16 md:py-24 max-w-5xl mx-auto grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center text-xs font-medium rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-400">
              B2C job search · B2B hiring workspaces
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              The modern hiring OS{" "}
              <span className="block text-emerald-500">for teams &amp; talent.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              Jobly gives job seekers a beautiful, consumer-grade experience while employers hire in
              fully isolated, real-time workspaces powered by Clerk Organizations and Convex.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs">
                <button className="px-5 py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90">
                  Browse open roles
                </button>
              </Link>
              <Link href="/employer/dashboard">
                <button className="px-5 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                  Post a job for free
                </button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-medium">Realtime by default</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Convex keeps job boards, pipelines, and activity feeds instantly in sync.
                </p>
              </div>
              <div>
                <p className="font-medium">Org-grade access</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Clerk Organizations power multi-member employer workspaces with roles and SSO-ready auth.
                </p>
              </div>
              <div>
                <p className="font-medium">Built for SaaS</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Next.js App Router, Tailwind v4, and Clerk Billing friendly architecture from day one.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Live hiring workspace</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Realtime
              </span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">Senior Product Designer</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  12 applicants
                </span>
              </div>
              <p className="text-slate-400 text-xs">Jobly, Remote · $140k - $180k · Equity</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div className="rounded-md bg-slate-900/60 border border-slate-800 px-2 py-1">
                  <p className="text-slate-400">Pipeline</p>
                  <p className="font-semibold">5 in review</p>
                </div>
                <div className="rounded-md bg-slate-900/60 border border-slate-800 px-2 py-1">
                  <p className="text-slate-400">Time to hire</p>
                  <p className="font-semibold">18 days</p>
                </div>
                <div className="rounded-md bg-slate-900/60 border border-slate-800 px-2 py-1">
                  <p className="text-slate-400">Team</p>
                  <p className="font-semibold">3 collaborators</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <span className="h-6 w-6 rounded-full bg-slate-700 border border-slate-900" />
                  <span className="h-6 w-6 rounded-full bg-slate-600 border border-slate-900" />
                  <span className="h-6 w-6 rounded-full bg-slate-500 border border-slate-900" />
                </div>
                <button className="px-3 py-1.5 rounded-md bg-emerald-500 text-emerald-950 text-xs font-medium hover:bg-emerald-400">
                  Open hiring workspace
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-8 pb-16 max-w-5xl mx-auto grid gap-8 md:grid-cols-3 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">FOR CANDIDATES</p>
            <p className="font-medium mb-1">Apply once, stay in sync</p>
            <p>
              Track every application in one place, with live status updates as hiring teams move you
              through their pipeline.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">FOR TEAMS</p>
            <p className="font-medium mb-1">Multi-member workspaces</p>
            <p>
              Invite recruiters, hiring managers, and coordinators into a shared view of every role,
              applicant, and conversation.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">FOR FINANCE</p>
            <p className="font-medium mb-1">Org-level billing</p>
            <p>
              Centralize plans and invoices at the organization level with Clerk Billing, while you
              focus on hiring outcomes.
            </p>
          </div>
        </section>
      </main>

      <footer className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Jobly. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="#" className="hover:text-primary">
            Terms
          </Link>
          <Link href="#" className="hover:text-primary">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
