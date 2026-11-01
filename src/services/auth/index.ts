import type { AuthService, AuthUser, Unsub } from './types';

export * from './types';
import { isFirebaseConfigured } from '../firebase';

export const isMockMode =
  import.meta.env.VITE_DATA_MODE === 'mock' || !isFirebaseConfigured;

let cachedAuth: AuthService | null = null;

async function getAuthService(): Promise<AuthService> {
  if (cachedAuth) return cachedAuth;
  if (isMockMode) {
    const { mockAuth } = await import('./mockAuth');
    cachedAuth = mockAuth;
  } else {
    const { firebaseAuth } = await import('./firebaseAuth');
    cachedAuth = firebaseAuth;
  }
  return cachedAuth;
}

export const auth: AuthService = {
  onAuthChange(cb: (u: AuthUser | null | undefined) => void): Unsub {
    let innerUnsub: Unsub | null = null;
    let isCancelled = false;

    // Immediately notify loading state
    cb(undefined);

    getAuthService()
      .then((service) => {
        if (isCancelled) return;
        innerUnsub = service.onAuthChange(cb);
      })
      .catch(() => {
        if (!isCancelled) {
          cb(null);
        }
      });

    return () => {
      isCancelled = true;
      if (innerUnsub) {
        innerUnsub();
      }
    };
  },

  async signUp(email: string, password: string): Promise<AuthUser> {
    const service = await getAuthService();
    return service.signUp(email, password);
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    const service = await getAuthService();
    return service.signIn(email, password);
  },

  async signInWithGoogle(): Promise<AuthUser> {
    const service = await getAuthService();
    return service.signInWithGoogle();
  },

  async resetPassword(email: string): Promise<void> {
    const service = await getAuthService();
    return service.resetPassword(email);
  },

  async signOut(): Promise<void> {
    const service = await getAuthService();
    return service.signOut();
  },
};
