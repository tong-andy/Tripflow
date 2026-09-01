# TripFlow Development Guide

## Product

TripFlow is a personal travel planning and travel management application.

The product covers the full travel lifecycle:

Before

- preparation
- visa
- flights
- hotels
- packing

During

- daily itinerary
- places
- notes
- travel status

After

- expenses
- purchases
- media notes
- journal

---

## Tech Stack

Frontend:

- React
- TypeScript
- Vite

UI:

- Tailwind CSS

Routing:

- React Router

Backend:

- Supabase

Database:

- PostgreSQL

PWA:

- vite-plugin-pwa

Testing:

- Vitest
- React Testing Library
- Playwright

---

## Product Principles

1. Mobile usability is a core requirement.

2. Desktop is primarily used for planning.

3. Mobile is primarily used during travel.

4. UI should remain simple and tool-oriented.

5. Information clarity is more important than visual decoration.

6. Avoid unnecessary features.

7. V1 should not include AI itinerary generation.

---

## Responsive Requirements

All major pages must support:

- 1440px desktop
- 768px tablet
- 390px mobile

No core feature may depend on desktop-only interaction.

---

## Data Safety

Never delete user data without confirmation.

All Supabase tables containing user data must use Row Level Security.

Users must never be able to access another user's travel data.

---

## Offline Behavior

Current:

- The PWA app shell can open offline after a successful prior load.
- Supabase API responses are not cached; business data requires a network connection to load.
- Business-data offline cache, IndexedDB persistence, offline write queues, and sync conflict handling are not implemented.

Future direction:

- If a future offline phase is explicitly requested, consider an IndexedDB read cache for the recent trip or Today data, limited offline writes, and reconnect synchronization.
- These are future-work directions, not current capabilities.

Do not implement complex offline synchronization unless explicitly requested.

---

## Development Rules

Before starting a development task:

1. Read `AGENTS.md` and `PROJECT_STATUS.md`.
2. Read the relevant existing code and verify the current repository state.
3. Treat `PROJECT_STATUS.md` and the current code as the primary sources of project status; do not rely only on historical chat context.
4. Understand the current architecture.
5. Avoid modifying unrelated code.
6. Prefer simple solutions.
7. Avoid unnecessary dependencies.

After implementation:

1. Run lint.
2. Run TypeScript type checking.
3. Run relevant tests.
4. Run the production build.
5. Fix errors before considering the task complete.

Before finishing a task, check whether the work materially changed the current phase, major features, navigation, data model, migrations, Provider / Repository architecture, PWA / offline capabilities, or known issues. If it did, update `PROJECT_STATUS.md` in the same task so it remains consistent with the code.

Small copy changes, CSS-only adjustments, and bug fixes with no architectural or project-status impact do not require a `PROJECT_STATUS.md` update.

---

## UI Rules

Use a clean and minimal visual style.

Prefer:

- clear hierarchy
- generous spacing
- card-based information
- subtle borders
- clear status indicators

Avoid:

- excessive animation
- decorative gradients
- overly dense screens
- unnecessary modal dialogs

---

## V1 Scope

V1 includes:

- authentication
- trip creation
- trip dashboard
- preparation checklist
- daily itinerary
- itinerary status
- expenses
- purchases
- media notes
- journal
- responsive mobile UI
- PWA
- cloud synchronization
- app shell offline access

V1 does NOT include:

- AI trip planning
- multiplayer collaboration
- social features
- automatic flight import
- automatic hotel import
- complex map route optimization
- native iOS app
- native Android app
- large media uploads

---

## Code Quality

Use TypeScript strict typing.

Do not use `any` unless strictly necessary.

Prefer reusable components when duplication is meaningful.

Do not abstract prematurely.

Keep components reasonably small and focused.

---

## Definition of Done

A task is complete only when:

- the feature works
- mobile layout works
- TypeScript passes
- tests pass
- production build succeeds
- no unrelated regression is introduced
