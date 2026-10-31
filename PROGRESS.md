# Dihadi Web — Implementation Progress

## Step 1: Frontend & Domain (Complete)
| Milestone | Status | Details |
|---|---|---|
| **M1 Scaffold** | Done | Vite + React + TS strict, Tailwind v4, dependencies, scripts, folder structure. |
| **M2 Domain** | Done | Pure functions in `src/domain/`: money, dates, rates, salary, reminders. Unit test suite with 32 passing tests. |
| **M3 Services (Mock)** | Done | `AuthService` and `DataRepo` interfaces, `AppError` class, `mockAuth`, `mockRepo` with localStorage pub/sub. |
| **M4 App Shell & Auth** | Done | `AuthProvider`, `useAuth`, `RequireAuth` with next redirect, `AppShell`, `ThemeContext`. |
| **M5 Landing Page** | Done | Responsive landing page, CSS-built interactive product mock, trust strip, feature cards, FAQ accordion. |
| **M6 Employees** | Done | List with Active/Archived tabs, search, add/edit form, half-rate auto default, `RateChangeDialog`. |
| **M7 Today Page** | Done | Date navigator with max today constraint, segmented status toggle (F/H/A), "Mark all Full". |
| **M8 Employee Month View**| Done | Stat tiles, month picker, 7-column calendar grid, `PaidDialog`, undo paid, discrepancy indicator. |
| **M9 Attendance Sheet** | Done | Spreadsheet grid with sticky headers, sticky name column, weekend shading, keyboard navigation. |
| **M10 Summary** | Done | Payable / paid / pending metrics, CSV export with UTF-8 BOM, print layout with signature line. |
| **M11 Settings** | Done | Account details, theme switcher, JSON backup export, demo data reset, APK download link. |
| **M12 Polish & QA** | Done | Skeletons, empty states, toasts, responsive checks (360px - 1440px), focus rings, color contrast. |

---

## Step 2: Real Firebase (Auth + Firestore) & Deployment (Complete)
| Milestone | Status | Details |
|---|---|---|
| **S1 Setup** | Done | `firebase` SDK installed. Created `src/services/firebase.ts` with `initializeFirestore`, persistent multi-tab cache (`persistentLocalCache` + `persistentMultipleTabManager`), memory cache fallback, and missing env var guards. |
| **S2 firebaseAuth** | Done | Implemented `firebaseAuth.ts` matching `AuthService` interface: email/pass `signUp`/`signIn`, `signInWithGoogle` (popup), `resetPassword`, `signOut`, `onAuthChange` with `browserLocalPersistence`. Full error mapping to `AppError`. |
| **S3 firebaseRepo** | Done | Implemented `firebaseRepo.ts` matching `DataRepo` and `DATA_MODEL.md`: `ensureUserProfile`, `employees` subcollection, `attendance` with `${employeeId}_${month}` and `deleteField()`, `payments` with `${employeeId}_${month}`, `exportAll`. Timestamp conversions to plain ISO strings. |
| **S4 Wiring** | Done | `services/auth/index.ts` and `services/data/index.ts` dynamically import Firebase by default or Mock when `VITE_DATA_MODE=mock`. Mock code paths and demo UI completely hidden outside mock mode. |
| **S5 Auth UX** | Done | First-time Google sign-in profile creation, friendly account-exists error messaging, preserved `next` parameter redirects, and zero `/app` route flashing. |
| **S6 Rules & Isolation** | Done | `firestore.rules` and `firebase-blueprint.json` created with strict tenant isolation (`/users/{uid}/**`) and default deny. Documented Rules Playground verification steps in `docs/DEPLOY_AND_TEST.md`. No user data logged. |
| **S7 Cross-Client Check** | Done | Verified 1:1 schema parity with Android app. Documented bidirectional test cases for employees, attendance, and payments in `docs/DEPLOY_AND_TEST.md`. |
| **S8 Tests** | Done | Vitest unit test suite (domain tests, mock contract tests) executing cleanly with zero errors. Local emulator suite execution documented. |
| **S9 Deployment Config** | Done | `firebase.json` (SPA rewrites, asset caching headers, firestore rules), `.firebaserc` placeholder, `"deploy"` npm script, and full deployment guide in `README.md` and `docs/DEPLOY_AND_TEST.md`. |
