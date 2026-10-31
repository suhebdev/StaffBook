# Decisions Log — Dihadi Web

All engineering decisions and trade-offs made during the Step 1 and Step 2 implementation.

| ID | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| D01 | React Router data router (`createBrowserRouter`) with lazy loading | Clean route layout, nested routes for `AppShell`, keeping initial landing bundle under 300KB gzipped. | HashRouter, static single-page state |
| D02 | LocalStorage MockAuth + MockRepo with deterministic IDs | Follows exact Firestore schemas (`users/{uid}/employees/{id}`, `users/{uid}/attendance/{id}`, `users/{uid}/payments/{id}`). Enables zero backend during Step 1 while allowing seamless swap in Step 2. | In-memory only state (lost on refresh), full mocked backend server |
| D03 | 150ms artificial latency in MockRepo and MockAuth | Exercises skeleton loaders, saving spinners, and optimistic feedback as required by the spec. | Instant sync (fails to exercise loading UI) |
| D04 | Status representation always includes text letters (F/H/A) alongside colors | Strict accessibility (WCAG 1.4.1 Use of Color) and Rule 9 of the prompt. | Color-only dots or pills |
| D05 | Single-session warning dialog for editing paid months | Alert users before altering attendance that causes discrepancies with snapshot payments, persisted in `sessionStorage`. | Blocking edits entirely, or nagging on every single cell click |
| D06 | Pure CSS product mock on landing page | Lightweight, responsive, theme-aware, avoids raster screenshot assets and blurry UI. | Static PNG/WebP screenshots |
| D07 | RFC 5545 .ics generation with CRLF and VALARM | Native calendar reminder integration without requiring push notification servers in web v1. | Third-party calendar API integrations |
| D08 | UTF-8 BOM in CSV export | Guarantees instant correct display in Microsoft Excel without character encoding issues for Indian names. | Raw ASCII or un-prefixed UTF-8 |
| D09 | Firebase Modular SDK with Multi-Tab Persistent Cache | Enables offline operations, fast reloads, and multi-tab synchronization without writes colliding. | Single-tab persistence, memory-only cache |
| D10 | Dynamic imports in service selectors (`services/*/index.ts`) | Allows clean tree-shaking of mock auth / demo code in production builds and isolates Firebase env checks so unit tests run offline without mock credentials. | Static imports with runtime if-statements |
| D11 | Deterministic document IDs (`${employeeId}_${month}`) for Attendance and Payments | Ensures 1:1 cross-platform parity with the Android app, simplifies querying by month, and prevents duplicate records. | Random Firestore auto-generated document IDs |
| D12 | Generic message for `auth/invalid-credentials` | Maps `user-not-found`, `wrong-password`, and `invalid-credential` to a single opaque error message to prevent account enumeration attacks. | Distinct error messages exposing whether an email exists |
| D13 | `setDoc` with `deleteField()` for daily status deletion | Completely purges untracked day entries from the `days` map instead of setting them to null or empty strings. | Storing empty strings or separate attendance entries per day |
| D14 | Cache-Control headers in `firebase.json` | 1-year immutable caching for hashed static assets (`/assets/**`) and strict `no-cache, no-store` for `index.html` to guarantee instant client updates on deploy. | Default Firebase hosting caching |

## Later (Backlog / Future Enhancements)
- Advances and salary deductions
- Multi-user staff check-in accounts
- WhatsApp salary slip sharing
- Scheduled Cloud Functions for web push notifications via FCM (Step 2+)


## Theming: per-component `dark:` variants instead of a global override stylesheet
Light mode was previously produced by a large `html:not(.dark)` block of `!important` overrides that remapped hard-coded dark hex classes. It was replaced by explicit `dark:` variants in each component (with a class-based `@custom-variant dark`), which is easier to maintain, has no `!important` conflicts, and keeps both themes next to each other in the markup. Light-theme text colors were darkened where needed for WCAG AA contrast.
