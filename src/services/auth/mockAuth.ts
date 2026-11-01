import type { AuthService, AuthUser, Unsub } from './types';
import { AppError } from '@/lib/errors';

interface StoredAccount {
  uid: string;
  email: string;
  password?: string;
}

const STORAGE_KEY_ACCOUNTS = 'staffbook:mock:accounts';
const LEGACY_STORAGE_KEY_ACCOUNTS = 'dihadi:mock:accounts';
const STORAGE_KEY_SESSION = 'staffbook:mock:session';
const LEGACY_STORAGE_KEY_SESSION = 'dihadi:mock:session';

function getAccounts(): Record<string, StoredAccount> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY_ACCOUNTS) ||
      localStorage.getItem(LEGACY_STORAGE_KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, StoredAccount>): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (_) {}
}

function getSessionUid(): string | null {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_SESSION) ||
      localStorage.getItem(LEGACY_STORAGE_KEY_SESSION)
    );
  } catch {
    return null;
  }
}

function saveSessionUid(uid: string | null): void {
  try {
    if (uid) {
      localStorage.setItem(STORAGE_KEY_SESSION, uid);
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      localStorage.removeItem(LEGACY_STORAGE_KEY_SESSION);
    }
  } catch (_) {}
}

const authListeners = new Set<(user: AuthUser | null | undefined) => void>();

function notifyListeners(user: AuthUser | null | undefined): void {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (_) {}
  });
}

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAuth: AuthService = {
  onAuthChange(cb: (u: AuthUser | null | undefined) => void): Unsub {
    authListeners.add(cb);

    // Initial check
    setTimeout(() => {
      const uid = getSessionUid();
      if (!uid) {
        cb(null);
        return;
      }
      const accounts = getAccounts();
      const account = Object.values(accounts).find((a) => a.uid === uid);
      if (account) {
        cb({ uid: account.uid, email: account.email });
      } else {
        saveSessionUid(null);
        cb(null);
      }
    }, 50);

    return () => {
      authListeners.delete(cb);
    };
  },

  async signUp(email: string, password: string): Promise<AuthUser> {
    await delay(150);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new AppError('auth/invalid-credentials');
    }
    if (!password || password.length < 6) {
      throw new AppError('auth/weak-password');
    }

    const accounts = getAccounts();
    if (accounts[cleanEmail]) {
      throw new AppError('auth/email-in-use');
    }

    const uid = 'mock-user-' + Math.random().toString(36).substring(2, 9);
    const newAccount: StoredAccount = { uid, email: cleanEmail, password };
    accounts[cleanEmail] = newAccount;
    saveAccounts(accounts);
    saveSessionUid(uid);

    const user: AuthUser = { uid, email: cleanEmail };
    notifyListeners(user);
    return user;
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    await delay(150);
    const cleanEmail = email.trim().toLowerCase();

    const accounts = getAccounts();
    const account = accounts[cleanEmail];

    if (!account || account.password !== password) {
      throw new AppError('auth/invalid-credentials');
    }

    saveSessionUid(account.uid);
    const user: AuthUser = { uid: account.uid, email: account.email };
    notifyListeners(user);
    return user;
  },

  async signInWithGoogle(): Promise<AuthUser> {
    await delay(150);
    const googleEmail = 'demo.google@example.com';
    const accounts = getAccounts();

    let account = accounts[googleEmail];
    if (!account) {
      const uid = 'mock-user-google-demo';
      account = { uid, email: googleEmail };
      accounts[googleEmail] = account;
      saveAccounts(accounts);
    }

    saveSessionUid(account.uid);
    const user: AuthUser = { uid: account.uid, email: account.email };
    notifyListeners(user);
    return user;
  },

  async resetPassword(email: string): Promise<void> {
    await delay(150);
    // Generic response (always succeeds per security best practice)
    return;
  },

  async signOut(): Promise<void> {
    await delay(100);
    saveSessionUid(null);
    notifyListeners(null);
  },
};
