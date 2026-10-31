# Dihadi Web — Staff Attendance & Salary

Companion web application for daily staff attendance, attendance spreadsheet view, automatic monthly wage calculation, and payroll records. Powered by React 19, TypeScript, and Firebase Firestore & Auth.

---

## Features
- **Fast Daily Attendance:** Segmented toggle buttons (`F` / `H` / `A`) with tap-again-to-clear and bulk "Mark all Full".
- **Attendance Sheet Grid:** Desktop spreadsheet view with sticky headers, sticky employee names column, weekend shading, and full keyboard navigation (Arrows, `F`/`H`/`A`, `Backspace`/`Delete`, `Space`, `Home`/`End`, `?`).
- **Salary Automation:** Computes wages based on full and half day rates. Unmarked days warning for past months.
- **Safe Rate Changes:** Apply wage increases from any chosen effective month without breaking or recalculating previous records.
- **Due Now Panel:** Automatic list of due and overdue salaries for active staff with one-click payment recording.
- **Data Export & Print:** Excel-compatible CSV export with UTF-8 BOM, print-friendly monthly summary with signature lines, and complete JSON backup export.
- **Calendar .ics Integration:** Download pay-day reminders directly into Google Calendar or Apple Calendar.
- **Multi-Tab Offline Sync:** Powered by Firebase Firestore's `persistentLocalCache` with `persistentMultipleTabManager`.
- **Light / Dark / System Themes:** Fully themed UI with a theme switcher in Settings → Appearance, persisted in `localStorage` and applied before first paint (see *Theming* below).

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

```env
# Application Data Mode ('firebase' for real Firebase, 'mock' for local offline testing)
VITE_DATA_MODE=firebase

# Site & Companion APK
VITE_SITE_URL=http://localhost:3000
VITE_APK_URL=

# Firebase Web App Config (from Firebase Console -> Project Settings -> General -> Your apps -> Web app)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

### Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Scripts
- `npm run dev`: Starts Vite development server on port 3000.
- `npm run build`: Compiles TypeScript and builds production bundles into `/dist`.
- `npm run preview`: Previews the production build locally.
- `npm run typecheck`: Runs strict TypeScript check (`tsc --noEmit`).
- `npm run lint`: Validates code quality and type definitions.
- `npm test`: Runs the Vitest test suite.
- `npm run deploy`: Builds the application and deploys hosting to Firebase.

---

## Production Deployment to Firebase Hosting

### Step 1: Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com) and open your project.
2. In **Authentication** > **Sign-in method**, enable **Email/Password** and **Google**.
3. In **Authentication** > **Settings** > **Authorized domains**, ensure your hosting domain (e.g. `<project-id>.web.app`, `<project-id>.firebaseapp.com`) is added.

### Step 2: Deploy Commands
```bash
# 1. Login to Firebase CLI
npx firebase-tools login

# 2. Select your Firebase project
npx firebase-tools use <project-id>

# 3. Deploy Firestore Security Rules
npx firebase-tools deploy --only firestore:rules

# 4. Build and deploy hosting
npm run deploy
```

---

## Architecture & Data Model Documentation
- [System Architecture](docs/ARCHITECTURE_WEB.md): Layered architecture, service abstraction, dynamic mode resolver, and offline cache.
- [Data Model & Firestore Schema](docs/DATA_MODEL.md): Exact document paths, deterministic IDs (`${employeeId}_${month}`), schemas, and Android cross-platform sync.
- [Deployment & Verification Guide](docs/DEPLOY_AND_TEST.md): Detailed deployment steps, security rules verification, Rules Playground test matrix, and cross-client testing checklist.
- [Decisions Log](docs/DECISIONS.md): Engineering decisions log (D01–D14).


---

## Theming

- **Mechanism:** Tailwind CSS v4 class-based dark mode. `src/index.css` declares `@custom-variant dark (&:where(.dark, .dark *))`, so every `dark:` utility follows the `dark` class on `<html>` rather than the OS setting.
- **State:** `src/components/layout/ThemeContext.tsx` (`light` | `dark` | `system`, default `system`) toggles the `dark`/`light` class, `data-theme`, and `color-scheme` on `<html>`, and follows live OS changes while `system` is selected.
- **No flash:** the inline script in `index.html` applies the saved theme (`localStorage` key `dihadi:theme`) before the app renders.
- **Styling convention:** components pair a light value with its dark counterpart, e.g. `bg-white dark:bg-[#14161B]`, `text-[#111827] dark:text-[#F2F0EC]`. Shared tokens also exist as CSS variables (`--bg-main`, `--text-primary`, ...) in `index.css`.
- **Contrast:** light-theme text colors were chosen to meet WCAG AA (4.5:1) on their backgrounds. Status colors are never the only signal; badges also carry letters/icons.
- **Toasts:** `sonner` follows the active theme via `ThemedToaster` in `src/App.tsx`.
- **Adding UI:** always supply both a light and a `dark:` value for background, text, and border colors. Brand coral fills (`bg-[#FF8278]` with dark text) are intentionally the same in both themes.
