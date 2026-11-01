import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { AuthService, AuthUser, Unsub } from './types';
import { AppError } from '@/lib/errors';

// Ensure browser local persistence
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch (_) {}

export function mapAuthError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new AppError('auth/invalid-credentials');
    case 'auth/email-already-in-use':
      return new AppError('auth/email-in-use');
    case 'auth/weak-password':
      return new AppError('auth/weak-password');
    case 'auth/network-request-failed':
      return new AppError('auth/network');
    case 'auth/popup-closed-by-user':
      return new AppError('auth/popup-closed');
    case 'auth/account-exists-with-different-credential':
      return new AppError('auth/account-exists');
    default:
      return new AppError('unknown', (err as Error)?.message || undefined);
  }
}

export const firebaseAuth: AuthService = {
  onAuthChange(cb: (u: AuthUser | null | undefined) => void): Unsub {
    cb(undefined);
    return onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          cb({ uid: user.uid, email: user.email });
        } else {
          cb(null);
        }
      },
      () => {
        cb(null);
      }
    );
  },

  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (err) {
      throw mapAuthError(err);
    }
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (err) {
      throw mapAuthError(err);
    }
  },

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (err) {
      throw mapAuthError(err);
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw mapAuthError(err);
    }
  },

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (err) {
      throw mapAuthError(err);
    }
  },
};
