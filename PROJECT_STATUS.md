# TripFlow Project Status

This document records the current repository state. Use the current code and migrations to verify it; do not infer project status from historical conversations.

## 1. Project Overview

- **Name:** TripFlow
- **Product:** A personal web application for planning and managing travel before, during, and after a trip.
- **Primary stack:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Supabase Auth, PostgreSQL, Vitest, React Testing Library, and Playwright.
- **Desktop:** Primarily a planning workspace with a persistent sidebar.
- **Mobile:** Primarily an in-trip tool with a five-item bottom navigation and contextual Today access.
- **PWA:** Installable standalone web app with an offline-capable app shell.

## 2. Current Phase

**Current Phase: Phase 03B.5**

TripFlow now uses one responsive five-item information architecture. The user-level My Trips home combines a structured-city travel footprint, dynamic year filters, cross-trip statistics, spending, and a timeline; profile/preferences are available from its settings drawer. The selected-trip overview and six-section preparation center have been reorganized without changing the stable Today, Records, spending, map-navigation, authentication, or PWA-shell behavior.

## 3. Current Navigation

### Mobile main navigation

1. 我的旅行 — `/trips`
2. 旅行总览 — `/overview`
3. 准备 — `/preparation`
4. 行程 — `/itinerary`
5. 记录 — `/archive`

`Today` (`/today`) remains a contextual active-trip route and is not a bottom-navigation item.

### Desktop main navigation

1. 我的旅行 — `/trips`
2. 旅行总览 — `/overview`
3. 准备 — `/preparation`
4. 行程 — `/itinerary`
5. 记录 — `/archive`

Desktop, tablet, mobile web, and PWA use the same five modules. `/profile` is a compatibility redirect to `/trips?settings=profile`; it is not a primary navigation item. Authentication routes are `/login` and `/auth/callback`. `/trips/:tripId/archive` resolves the requested trip before showing records.

## 4. Completed Features

### Authentication

- Email/password registration, login, and logout through Supabase Auth.
- Email confirmation guidance when registration does not immediately create a session.
- Magic Link / email OTP remains available as a secondary login method.
- Session restoration, auth-state updates, protected application routes, and translated safe error messages.

### Trips

- Create, select, list, edit, and delete trips.
- New trips select one or more destinations from a lightweight local city catalog; users never enter coordinates.
- Trip creation atomically generates the inclusive date range and structured destinations through `create_trip_with_days_v3`.
- Existing trips retain their legacy destination text; only trips with structured destinations appear on the footprint map.
- The My Trips home provides an SVG world footprint, dynamic year/all filters, cross-trip dashboard, per-currency spending, longest completed trip, and date-sorted timeline.
- Upcoming, active, and completed status is calculated in each trip's timezone.
- Selected-trip overview has a current-trip header, status, cities/date/duration, edit action, recent-trip switcher, preparation and itinerary progress, scoped spending/budget, next itinerary item, and trip note.
- Per-trip budget, timezone, and a nullable trip-level note of up to 10,000 characters.
- Completed trips remain selectable and their scoped records remain accessible.

### Preparation

- Trip-scoped checklist grouped into six ordered sections: transit, accommodation, documents, activities, connectivity, and essentials.
- Create, edit, complete/uncomplete, and confirm-delete actions.
- Overall and per-category progress display, collapsible vertical sections, notes, and an add action within every section that preselects its category.
- The Phase 03B.5 migration maps legacy booking to activities and packing/other to essentials without deleting rows.

### Itinerary

- Day-by-day itinerary navigation over generated trip days.
- Create, edit, status-update, and confirm-delete actions.
- Optional time and address, required place and positive duration, notes, and planned/completed/skipped status.
- Timed entries sort chronologically; untimed entries follow timed entries.

### Today

- Available only for the selected active trip and resolved using the trip timezone.
- Shows current candidate, next stop, timed itinerary, untimed items, and item status.
- Quick add for itinerary items and expenses while online.
- Quick completion/skipping and external map links.

### Records

- Trip-scoped record center at `/archive`.
- Modules are configurable from user preferences; hiding a module hides its entry without deleting data.
- Default visible modules are Expenses, Purchases, and Journals; Media Notes is opt-in unless historical media already exists.

### Expenses

- Create, edit, and confirm-delete expenses with date, title, amount, ISO currency, category, and notes.
- Per-currency totals, category totals, a per-currency category pie chart, and trip budget comparison.
- Other currencies are shown separately and are not included in a budget of a different currency.

### Purchases

- Create, edit, and confirm-delete purchase records.
- Tracks wanted/purchased state, include-in-expenses state, organization state, location, recipient, and notes.
- Only purchased items with `includeInExpenses` enabled participate in unified spending totals.

### Memories / Journals

- One journal entry per user and trip day.
- Create, edit, and confirm-delete daily text memories with an optional 1–5 rating.

### Media Notes

- Create, edit, favorite, and confirm-delete metadata notes for video, photo, audio, or other media.
- Optional links to a trip day and itinerary item.
- Stores filenames/labels and notes only; large media upload is not implemented.

### Profile / Preferences

- User-level nickname and home location.
- User-level default currency, default timezone, and default map provider.
- User-level visibility preferences for each record module, with at least one module required.
- Profile and preferences open in a responsive drawer from the My Trips header instead of occupying a primary route.
- Cross-trip dashboard statistics are part of My Trips and use structured cities/countries plus per-currency spending.

### Map Navigation

- External navigation links for Apple Maps, AMap, Baidu Maps, and Google Maps.
- `system` resolves to Apple Maps on Apple platforms and Google Maps otherwise.
- The saved user map preference is applied to itinerary and Today links.
- The travel-footprint SVG is a separate lightweight visualization driven by stored destination coordinates; it is not a navigation map and uses no map SDK.

### PWA / Offline

- Web app manifest, standalone display metadata, install icons, and auto-updating service worker.
- Workbox precaches the app shell and static JS/CSS/HTML/icon/font assets.
- Online/offline detection and explicit offline status messaging.

### Responsive / Mobile UX

- Layout and Playwright projects cover 1440px desktop, 768px tablet, and 390px mobile.
- Desktop sidebar and mobile bottom navigation are breakpoint-specific.
- Mobile form controls use a 16px font to avoid unintended iOS zoom.
- Mobile itinerary editing uses a full-screen editor and does not rely on browser-history back behavior.
- Safe-area padding is used for the fixed bottom navigation and mobile editor.

## 5. Data Architecture

Primary flow:

`Page / Component → Provider → Repository / Service → Supabase`

Main providers:

- `AuthProvider` — session and authentication actions.
- `NetworkProvider` — current network reachability.
- `TripProvider` — trips, structured destinations, trip days, preparation items, and itinerary items.
- `ProfileProvider` — user profile/preferences plus cross-trip expense and purchase inputs for the My Trips dashboard.
- `ArchiveProvider` — expenses, purchases, media notes, and journals for the selected trip.

Main repositories and services:

- `supabaseAuthService`
- `supabaseTripRepository`
- `supabaseProfileRepository`
- `supabaseArchiveRepository`
- `createLegacyTripRepository` — explicit Phase 02A compatibility/test adapter backed by versioned `localStorage`; not the production default and not automatically merged with Supabase.

Pages do not directly access Supabase. Repositories scope reads and mutations with the authenticated `userId`; providers coordinate loading, mutation state, and in-memory UI state.

Trip-level data is selected and isolated by `tripId`: structured destinations, trip days, preparation, itinerary, expenses, purchases, media notes, journals, budget, timezone, and travel note. User-level data is keyed by `userId`: profile, defaults, map preference, record-module preferences, and cross-trip dashboard inputs.

## 6. Supabase / Database

Current primary tables:

- `trips` — owned trip metadata, dates, budget pair, timezone, and travel note.
- `trip_destinations` — ordered structured cities/countries and coordinates belonging to one owned trip.
- `trip_days` — ordered inclusive dates belonging to a trip.
- `preparation_items` — trip preparation checklist entries.
- `itinerary_items` — day-linked itinerary entries.
- `expenses` — trip expenses.
- `purchases` — trip purchases and spending-inclusion flags.
- `media_notes` — trip media metadata, optionally linked to a trip day and itinerary item.
- `journals` — day-linked memories; unique per user and trip day.
- `user_profiles` — user-level profile and preferences.

Important relationships:

- All user data references `auth.users`; deleting an auth user cascades to owned rows.
- Trip-owned child tables, including `trip_destinations`, use ownership-aware foreign keys containing `(trip_id, user_id)`.
- `trip_days` belongs to `trips`; preparation, expenses, and purchases belong to a trip.
- Itinerary items belong to both a trip and trip day.
- Media notes may belong to a trip day and itinerary item; journals must belong to a trip day.
- Deleting a trip cascades through its trip-owned data.

## 7. Applied Migrations

Repository migration order:

1. `20260831000100_create_tripflow_core.sql` — creates trips, trip days, preparation items, itinerary items, timestamps, ownership-aware relationships, indexes, grants, and RLS policies.
2. `20260831000200_create_trip_with_days_function.sql` — adds the authenticated security-invoker RPC that creates a trip and its generated days atomically.
3. `20260831000300_create_archive.sql` — adds trip budgets plus expenses, purchases, media notes, journals, their relationships, indexes, grants, and RLS policies.
4. `20260831000400_add_trip_timezone_and_itinerary_address.sql` — adds validated trip timezones, optional itinerary time/address, and timezone-aware atomic trip creation via `create_trip_with_days_v2`.
5. `20260831000500_create_user_profiles.sql` — adds user profiles and default currency, timezone, and map preferences with RLS.
6. `20260831000600_record_center_preferences_and_purchase_spending.sql` — adds record-module preferences and explicit purchase `purchased` / `include_in_expenses` semantics, preserving historical media visibility.
7. `20260831000700_add_trip_travel_note.sql` — adds the bounded nullable trip-level `travel_note` field.
8. `20260831000800_trip_destinations_and_preparation_center.sql` — adds owned structured trip destinations, authenticated create/replace RPCs, preparation notes, six categories, and a non-destructive legacy-category mapping.

Do not edit old migrations. Add a new migration for future schema changes and update this section in the same task.

## 8. Security Model

- Supabase Auth supplies the browser session and authenticated user identity.
- Every current user-data table has Row Level Security enabled.
- CRUD policies use `auth.uid() = user_id` for ownership checks; inserts and updates include `WITH CHECK` ownership enforcement.
- Composite foreign keys prevent child rows from being attached to a trip or trip day owned by another user.
- Anonymous table access is revoked; authenticated users receive only the operations constrained by RLS.
- Frontend repositories additionally filter by `user_id`, and trip-scoped repositories filter by `trip_id` where applicable.
- Browser configuration uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Secret keys, service role keys, database passwords, and deployment tokens must never be placed in frontend code or committed environment files.

## 9. Important Product Rules

- Today is a contextual active-trip route, not a mobile bottom-navigation destination.
- Direct access to Today for a non-active trip redirects to the trip overview.
- Preparation, Itinerary, Today, and Records operate on the currently selected trip.
- My Trips and its profile/preferences drawer are user-level; Preparation, Itinerary, Today, Records, and Overview operate on the selected trip.
- My Trips owns cross-trip year filtering; the selected-trip overview only provides a lightweight recent-trip switcher.
- Footprint markers come only from structured `trip_destinations`; legacy destination text is never geocoded or guessed.
- A user's default timezone seeds new trips; changing it does not alter existing trip timezones.
- Trip status and Today date matching use the trip timezone, not the browser's UTC date or the user default timezone.
- Multiple currencies are never summed into one converted total; they remain separate.
- A Purchase counts toward spending exactly once only when it is purchased and `includeInExpenses` is true.
- Only spending in the trip budget currency affects remaining-budget calculations.
- Completed trips and their historical records remain accessible.
- Hiding a record module does not delete its data; at least one record module must remain visible.
- Historical media remains discoverable until the user explicitly hides the Media Notes module.
- Destructive UI actions require confirmation and remain subject to ownership checks.
- Each user can have at most one journal entry for a given trip day.

## 10. PWA / Offline Status

### App shell offline

Implemented. The generated service worker precaches the app shell and static assets, uses `/index.html` as the navigation fallback, updates automatically, and allows the application UI to reload offline after a prior successful load.

### Business data offline cache

Not implemented. Production providers read business data from Supabase and do not persist synchronized trips, itinerary, records, or profiles in IndexedDB or another production offline cache. Already rendered in-memory data may remain visible during the current session, but an offline reload cannot reliably restore business data.

The versioned `localStorage` trip store is a retained legacy compatibility adapter, not an offline cache for the active Supabase data path.

### Offline write / sync

Not implemented. There is no offline mutation queue, conflict resolution, or later synchronization. Today explicitly disables quick writes while offline; offline writes elsewhere are unsupported and will fail through the cloud repository.

## 11. Testing Status

Quality commands:

- Lint: `npm run lint`
- Type checking: `npm run typecheck`
- Unit/component tests: `npm test`
- Playwright E2E: `npm run test:e2e`
- Production build: `npm run build`

Current test coverage includes domain rules, repository ownership/scoping, migrations, authentication, providers, routing, PWA configuration, mobile safeguards, cloud-backed core flows, records, Today, responsive usability, structured destinations, footprint/year/timeline behavior, the six-section preparation center, and three Playwright viewports (1440, 768, 390).

Latest local verification for Phase 03B.5:

- Lint: passed (`npm run lint`)
- Typecheck: passed (`npm run typecheck`)
- Unit/component tests: passed — 18 files, 83 tests (`npm test`)
- Playwright E2E: passed — 57 collected, 39 passed and 18 intentionally skipped by project-specific guards (`npm run test:e2e`)
- Production build: passed (`npm run build`), with the known chunk-size warning below

Update these results only when the commands are actually run; update test counts when they change materially.

## 12. Deployment

- GitHub is the source-code version-control system; `main` is the deployment branch.
- Netlify automatically deploys the application from `main`.
- Supabase provides Auth and PostgreSQL Database services.
- Deployment and Supabase credentials are supplied through environment configuration and are not documented here.

## 13. Known Issues / Technical Debt

- Business-data offline caching and offline write/synchronization are not implemented.
- The Phase 02A versioned `localStorage` implementation remains as an explicit legacy/test adapter and is separate from production Supabase data.
- The current production build emits a chunk-size warning: the main minified JavaScript chunk is about 652 kB (about 187 kB gzip), above Vite's 500 kB warning threshold.
- The bundled local city catalog intentionally covers major travel cities rather than every city worldwide; it is designed for incremental expansion.

## 14. Next / Not Started

TBD

No next phase is explicitly defined in the current repository.

## 15. Last Updated

- **Date:** 2026-09-01
- **Phase:** Phase 03B.5
- **Summary:** Unified primary navigation, merged profile/preferences into My Trips, added structured destination footprints and year/timeline dashboard, rebuilt the selected-trip overview and preparation center, and added migration/RLS/test coverage.
