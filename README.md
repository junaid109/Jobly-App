# Jobly – Multi‑Tenant Job Platform (Indeed Clone)

Jobly is a full‑stack, multi‑tenant job platform inspired by Indeed. It combines a **consumer‑grade job search experience** for candidates with **isolated, organization‑scoped workspaces** for employers. Built on **Next.js 16 App Router**, **Convex**, **Clerk**, and **Tailwind CSS v4**, Jobly delivers real‑time, reactive UX with modern SaaS patterns out of the box.

## Features

- **Modern job search (B2C)**
  - Rich job listings with filters, search, and detail pages
  - Candidate profiles and saved jobs
  - Instant UI updates for applications and status changes (no polling)

- **Multi‑tenant employer workspaces (B2B)**
  - Clerk Organizations–powered tenants for each company
  - Isolated data per organization (jobs, candidates, team members)
  - Role‑based access for hiring managers, recruiters, and admins

- **Real‑time, reactive architecture**
  - Convex for serverless data, queries, and mutations
  - Live subscriptions to data with automatic UI updates
  - No manual caching or invalidation required

- **Production‑ready UX & tooling**
  - Next.js 16 App Router (layouts, server components, routing)
  - Clerk for authentication and organizations
  - Tailwind CSS v4 for a clean, responsive UI
  - TypeScript and pnpm for a modern DX

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth & Multi‑Tenancy**: Clerk (Users + Organizations)
- **Backend & Data**: Convex (serverless functions, realtime database)
- **UI**: React 19, Tailwind CSS v4
- **Language**: TypeScript
- **Package Manager**: pnpm

## Architecture Overview

### High‑Level Flow

- **Job seekers (B2C)**
  - Browse and search jobs across public postings
  - Create and update profiles, apply to jobs, and track status
  - See changes instantly via Convex’s realtime subscriptions

- **Employers (B2B)**
  - Each company is represented as a **Clerk Organization**
  - Members manage jobs, review candidates, and collaborate in an isolated workspace
  - All data is scoped by organization to enforce tenant isolation

### Responsibilities

- **Next.js 16**
  - Routing, layouts, server components, and rendering
- **Clerk**
  - Authentication, user sessions, and organizations
- **Convex**
  - Data storage, queries, mutations, and realtime updates
- **Tailwind CSS v4**
  - Utility‑first styling for a professional, accessible UI

## Getting Started

### Prerequisites

- Node.js (LTS)
- pnpm
- Clerk project (or keyless dev mode)
- Convex project / deployment URL

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root (already git‑ignored) and add:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_CONVEX_URL=YOUR_CONVEX_URL
```

Replace the placeholders with your actual values. **Do not commit real keys.**

### Development

```bash
pnpm dev
```

This runs the Next.js dev server and Convex dev environment together.

## Project Structure (High Level)

- `app/` – App Router entry points and pages
- `components/` – Shared UI components and providers
  - `ConvexClientProvider.tsx` – Bridges Clerk auth context into Convex
- `convex/` – Convex functions, schema, and backend logic
- `public/` – Static assets

## Roadmap Ideas

- Advanced search and recommendations (skill‑based matching)
- Interview scheduling and in‑app messaging
- Billing and subscriptions for employer organizations
- Analytics dashboards for jobs and hiring funnels

## License

Add your chosen license here (for example, MIT) depending on how you intend to use and distribute Jobly.
