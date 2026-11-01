import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/services/auth/types';
import { auth } from '@/services/auth';
import { repo } from '@/services/data';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: typeof auth.signIn;
  signUp: typeof auth.signUp;
  signInWithGoogle: typeof auth.signInWithGoogle;
  resetPassword: typeof auth.resetPassword;
  signOut: typeof auth.signOut;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthChange((u) => {
      if (u === undefined) {
        setLoading(true);
      } else {
        setUser(u);
        setLoading(false);
        try {
          if (u) {
            localStorage.setItem('staffbook_logged_in', '1');
            localStorage.setItem('dihadi_logged_in', '1');
          } else {
            localStorage.setItem('staffbook_logged_in', '0');
            localStorage.setItem('dihadi_logged_in', '0');
          }
        } catch (_) {}
        if (u) {
          repo.ensureUserProfile(u).catch(() => {});
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.setItem('staffbook_logged_in', '0');
      localStorage.setItem('dihadi_logged_in', '0');
    } catch (_) {}
    return auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: auth.signIn,
        signUp: auth.signUp,
        signInWithGoogle: auth.signInWithGoogle,
        resetPassword: auth.resetPassword,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
