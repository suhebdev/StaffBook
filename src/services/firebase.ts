import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'mock-api-key';
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dihadi-demo.firebaseapp.com';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dihadi-demo';
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000';
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:000000000000';

  if (!isFirebaseConfigured) {
    console.info(
      '[Firebase] Configuration missing in environment. Running in mock/preview fallback mode.'
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

let app: FirebaseApp;
if (getApps().length === 0) {
  const config = getFirebaseConfig();
  app = initializeApp(config);
} else {
  app = getApp();
}

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch {
    firestoreDb = getFirestore(app);
  }
}

export const auth: Auth = getAuth(app);
export const db: Firestore = firestoreDb;

const firestoreDatabaseId =
  (db as any)._databaseId?.database ||
  (db as any).databaseId ||
  '(default)';

console.log('[DEBUG app start]', {
  projectId: app.options.projectId,
  firestoreDatabaseId,
  uid: auth.currentUser?.uid ?? null,
  email: auth.currentUser?.email ?? null,
});

auth.onAuthStateChanged((user) => {
  console.log('[DEBUG auth state change]', {
    projectId: app.options.projectId,
    firestoreDatabaseId,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
  });
});

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch {
    // Emulator connection errors are safe to ignore if already attached
  }
}

export { app };

