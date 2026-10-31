# Dihadi Web — System Architecture

## 1. Overview
Dihadi Web is a responsive Single Page Application (SPA) built for daily staff attendance tracking, spreadsheet views, salary automation, and payroll records. It interfaces with the same Firebase Firestore backend as the Dihadi Android app.

---

## 2. Layered Architecture

```
┌────────────────────────────────────────────────────────┐
│                      UI Layer                          │
│   React Router (Data Router, Lazy Loaded App Shell)    │
│   Tailwind CSS v4 with Custom Off-Black Design Tokens  │
├────────────────────────────────────────────────────────┤
│                   Feature Hooks                        │
│   useAuth, useEmployees, useAttendanceMonth,           │
│   usePayments, useDueNow                               │
├────────────────────────────────────────────────────────┤
│                 Service Abstraction                    │
│   AuthService Interface  │  DataRepo Interface         │
├──────────────────────────┼─────────────────────────────┤
│   Dynamic Mode Resolver (VITE_DATA_MODE)               │
├──────────────────────────┼─────────────────────────────┤
│  Mock Provider (Dev)     │  Firebase Provider (Prod)   │
│  - mockAuth              │  - firebaseAuth (Modular)   │
│  - mockRepo              │  - firebaseRepo (Firestore) │
│  - LocalStorage Pub/Sub  │  - Multi-tab Persistent DB  │
└──────────────────────────┴─────────────────────────────┘
```

---

## 3. Modular Service Boundary & Dynamic Import

All application views and React hooks depend solely on the abstract interfaces defined in:
- `src/services/auth/types.ts` (`AuthService`, `AuthUser`)
- `src/services/data/types.ts` (`DataRepo`)

In `src/services/auth/index.ts` and `src/services/data/index.ts`, implementations are resolved dynamically based on `import.meta.env.VITE_DATA_MODE`:
1. **`firebase` (Default):** Loads `firebaseAuth.ts` and `firebaseRepo.ts`. Directly uses the official Firebase v13 Modular SDK.
2. **`mock`:** Loads `mockAuth.ts` and `mockRepo.ts`. Uses browser `localStorage` with a reactive Pub/Sub listener system and simulated network delays.

This architecture ensures:
- In production builds (`VITE_DATA_MODE=firebase`), mock auth and demo data functions are tree-shaken and never reachable by users.
- In test environments without Firebase credentials, unit tests can execute deterministically without failing on missing environment variables.

---

## 4. Offline First & Multi-Tab Synchronization

The web application uses Firebase Firestore's offline cache engine:
- `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`
- If multiple browser tabs are open simultaneously, Firestore synchronizes changes across tabs in real time without data collision.
- If the browser loses network connectivity, read queries are fulfilled from the local IndexedDB cache, and outgoing writes are queued locally until connectivity resumes.
- If IndexedDB persistence is unavailable (such as in private browsing mode), the client automatically falls back to `memoryLocalCache()`.

---

## 5. Route Protection & Zero-Flash Navigation

Route access is enforced via `src/features/auth/RequireAuth.tsx`:
1. During initial auth token verification, `loading` is `true`. The component renders `<Loading fullScreen />` instead of child routes.
2. If `user` resolves to `null` (unauthenticated), it redirects immediately to `/login?next=...` with `{ replace: true }`.
3. Private `/app/*` routes are never mounted or flashed to unauthenticated users.
