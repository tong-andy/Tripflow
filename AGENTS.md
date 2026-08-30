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

Local cache:

- IndexedDB

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

Previously synchronized itinerary data should remain readable when offline.

Do not implement complex offline synchronization unless explicitly requested.

---

## Development Rules

Before implementing a feature:

1. Read the relevant existing code.
2. Understand the current architecture.
3. Avoid modifying unrelated code.
4. Prefer simple solutions.
5. Avoid unnecessary dependencies.

After implementation:

1. Run lint.
2. Run TypeScript type checking.
3. Run relevant tests.
4. Run the production build.
5. Fix errors before considering the task complete.

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
- basic offline reading

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
