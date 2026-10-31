# Dihadi Web — Deployment, Testing & Verification Guide

This guide covers deployment to Firebase Hosting, configuring environment variables, verifying Firestore security rules isolation, cross-client sync testing with the Android app, and local emulator testing.

---

## 1. Production Deployment to Firebase Hosting

### Step 1.1: Firebase Authentication Authorized Domains
1. Open [Firebase Console](https://console.firebase.google.com).
2. Select your Firebase Project.
3. Navigate to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and enter your production hosting domain (e.g., `<project-id>.web.app`, `<project-id>.firebaseapp.com`, or your custom domain).
5. If Google Sign-in is enabled, ensure Google provider is toggled **Enabled** in **Authentication** > **Sign-in method**.

### Step 1.2: Environment Variables
Create `.env.production` (or `.env`):
```env
VITE_DATA_MODE=firebase
VITE_SITE_URL=https://<your-project-id>.web.app

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

### Step 1.3: Deploying Hosting & Rules
Run the following commands:
```bash
# 1. Login to Firebase CLI
npx firebase-tools login

# 2. Select your project
npx firebase-tools use <project-id>

# 3. Deploy Firestore Security Rules
npx firebase-tools deploy --only firestore:rules

# 4. Build and deploy hosting
npm run deploy
```

---

## 2. Security Rules Verification & Multi-Tenant Isolation (S6)

The security model guarantees strict user isolation under `/users/{uid}/...`. A user can **never** read, list, or write another user's employees, attendance records, or payments.

### Test via Firebase Console Rules Playground:
1. Go to **Firestore Database** > **Rules** > **Rules Playground**.
2. **Test 1: User A accessing User A's data (PASS)**:
   - Operation: `get`
   - Location: `/databases/(default)/documents/users/user_alpha/employees/emp_1`
   - Authenticated: Toggle **ON**
   - Firebase UID: `user_alpha`
   - Result: **Allowed**
3. **Test 2: User B attempting to read User A's employee (BLOCKED)**:
   - Operation: `get`
   - Location: `/databases/(default)/documents/users/user_alpha/employees/emp_1`
   - Authenticated: Toggle **ON**
   - Firebase UID: `user_bravo`
   - Result: **Denied** (Permission Denied)
4. **Test 3: Unauthenticated request (BLOCKED)**:
   - Operation: `get`
   - Location: `/databases/(default)/documents/users/user_alpha/attendance/emp_1_2026-03`
   - Authenticated: Toggle **OFF**
   - Result: **Denied** (Permission Denied)
5. **Test 4: User B attempting to list User A's attendance (BLOCKED)**:
   - Operation: `list`
   - Location: `/databases/(default)/documents/users/user_alpha/attendance`
   - Authenticated: Toggle **ON**
   - Firebase UID: `user_bravo`
   - Result: **Denied** (Permission Denied)

---

## 3. Cross-Client Verification Checklist (Web & Android) (S7)

Since both Web and Android share the same backend database paths, verify bidirectional synchronization using this checklist:

### Test Case 1: Employee Record Sync
1. On Web (`/app/employees/new`), create an employee:
   - Name: `Ramesh Singh`
   - Phone: `9876543210`
   - Daily Full Rate: `₹700`, Half Rate: `₹350`
   - Payday Reminder: 5th of every month
2. In Firestore Console, verify document created at `/users/{uid}/employees/{employeeId}`:
   - Document contains `name`, `phone`, `joinedOn`, `rates`, `reminder`, `active: true`.
3. Open Android app logged in with the same account.
4. Verify `Ramesh Singh` appears in the employee list with rates and reminder intact.

### Test Case 2: Attendance Sync & Deterministic IDs
1. On Web (`/app/today` or `/app/sheet`), mark Ramesh:
   - Day 1: Full (`F`)
   - Day 2: Half (`H`)
   - Day 3: Absent (`A`)
2. In Firestore Console, verify `/users/{uid}/attendance/{employeeId}_2026-03`:
   - Document ID is exactly `{employeeId}_2026-03`.
   - `days` map contains `{"1": "F", "2": "H", "3": "A"}`.
3. On Android app, refresh/open March 2026 for Ramesh.
4. Verify Day 1 is Full, Day 2 is Half, Day 3 is Absent.
5. On Android app, mark Day 4 as Full.
6. Check Web attendance sheet: Day 4 immediately updates to `F` via Firestore real-time snapshot!

### Test Case 3: Payment Record Sync
1. On Web (`/app/summary`), click "Mark Paid" for Ramesh for March 2026.
2. In Firestore Console, verify `/users/{uid}/payments/{employeeId}_2026-03`:
   - Document ID is `{employeeId}_2026-03`.
   - `amount`, `paidOn`, `createdAt` are populated.
3. Check Android app: March 2026 shows status "PAID" with the settled amount.

---

## 4. Local Emulator Suite Testing (S8)

To run automated contract tests against the real Firebase Emulator Suite locally:
```bash
# 1. Install Firebase tools if not installed
npm install -g firebase-tools

# 2. Start Auth and Firestore emulators
firebase emulators:start --only auth,firestore

# 3. In another terminal, run tests with emulator flag
VITE_USE_EMULATOR=true npm test
```
All domain tests (`src/domain/__tests__`) run cleanly in all environments.
