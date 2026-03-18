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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4efe4_0%,#f8fafc_22%,#ffffff_100%)] text-foreground flex flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-bold text-amber-300">
              J
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-stone-900">Jobly</p>
              <p className="hidden text-xs text-stone-500 md:block">
                Search-first hiring marketplace
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs" className="text-stone-600 hover:text-stone-950 transition-colors">
              Find jobs
            </Link>
            <Link
              href="/employer/dashboard"
              className="text-stone-600 hover:text-stone-950 transition-colors"
            >
              Employers
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
                  Create account
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-5 pb-12 pt-10 md:px-8 md:pb-16 md:pt-14">
          <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1.2fr)_460px]">
            <div className="rounded-[2.2rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,#fff4d6_0%,#f7f1e4_33%,#ffffff_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(28,25,23,0.35)] md:p-10">
              <p className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                Indeed-style roadmap in motion
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 md:text-6xl">
                Search better jobs, faster, with a marketplace built for modern hiring.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
                Jobly is evolving from a solid MVP into a search-first hiring product: cleaner job
                discovery for candidates, better hiring workflows for teams, and richer company
                trust signals over time.
              </p>

              <form
                action="/jobs"
                method="get"
                className="mt-8 grid gap-3 rounded-[1.6rem] border border-stone-200 bg-stone-950 p-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto]"
              >
                <label className="rounded-[1.2rem] bg-white px-4 py-3">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Job title or keyword
                  </span>
                  <input
                    name="q"
                    placeholder="Product designer, frontend, recruiter..."
                    className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-stone-950 outline-none placeholder:text-stone-400"
                  />
                </label>
                <label className="rounded-[1.2rem] bg-white px-4 py-3">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Location
                  </span>
                  <input
                    name="l"
                    placeholder="London, New York, Remote"
                    className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-stone-950 outline-none placeholder:text-stone-400"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-[1.2rem] bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-300"
                >
                  Search jobs
                </button>
              </form>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <MetricCard value="1,200+" label="roles to grow into" />
                <MetricCard value="430+" label="hiring teams onboarding" />
                <MetricCard value="Real-time" label="application state sync" />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-white shadow-[0_30px_80px_-40px_rgba(28,25,23,0.45)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Live marketplace pulse</p>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Syncing
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  <PulseRow
                    title="Senior Product Designer"
                    meta="Remote • $140k-$180k • New"
                    badge="12 applicants"
                  />
                  <PulseRow
                    title="Founding Frontend Engineer"
                    meta="London • Hybrid • Equity"
                    badge="8 applicants"
                  />
                  <PulseRow
                    title="Talent Operations Lead"
                    meta="New York • Full-time"
                    badge="5 applicants"
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(28,25,23,0.35)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Why this direction matters
                </p>
                <div className="mt-4 space-y-4 text-sm text-stone-600">
                  <div>
                    <p className="font-semibold text-stone-900">Search-first candidate UX</p>
                    <p className="mt-1">
                      Faster filtering, richer job cards, and a clearer path from discovery to
                      application.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Better employer operations</p>
                    <p className="mt-1">
                      Shared workspaces, live applicant status, and stronger hiring workflow depth.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Trust layers coming next</p>
                    <p className="mt-1">
                      Company pages, reviews, salary insights, and the marketplace signals people
                      expect from an Indeed-like experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 md:px-8 md:pb-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            <FeaturePanel
              eyebrow="For candidates"
              title="Search like a real marketplace"
              body="Use keyword, location, work-style, and salary filters to narrow results faster and browse roles with stronger context."
              href="/jobs"
              cta="Explore jobs"
            />
            <FeaturePanel
              eyebrow="For employers"
              title="Run hiring from one shared workspace"
              body="Post roles, review applicants, and coordinate status updates in a single team-facing hiring surface."
              href="/employer/dashboard"
              cta="Open employer dashboard"
            />
            <FeaturePanel
              eyebrow="Roadmap"
              title="Trust, reviews, and salary insight"
              body="The next phases deepen Jobly into a stronger Indeed-style product with company discovery and richer marketplace signals."
              href="/jobs"
              cta="Browse the marketplace"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-4">
      <p className="text-2xl font-semibold text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-600">{label}</p>
    </div>
  );
}

function PulseRow({
  title,
  meta,
  badge,
}: {
  title: string;
  meta: string;
  badge: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-xs text-stone-300">{meta}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
          {badge}
        </span>
      </div>
    </div>
  );
}

function FeaturePanel({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[1.9rem] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(28,25,23,0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
      >
        {cta}
      </Link>
    </div>
  );
}
