import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { app, auth, db } from './services/firebase';

const firestoreDatabaseId =
  (db as any)._databaseId?.database ||
  (db as any).databaseId ||
  '(default)';

console.log('[App Startup]', {
  projectId: app?.options?.projectId ?? '(unconfigured)',
  firestoreDatabaseId,
  uid: auth?.currentUser?.uid ?? null,
  email: auth?.currentUser?.email ?? null,
});

createRoot(document.getElementById('root')!).render(<App />);
