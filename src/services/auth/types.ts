export type Unsub = () => void;

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthService {
  /** cb(undefined) = still loading, null = signed out, AuthUser = signed in */
  onAuthChange(cb: (u: AuthUser | null | undefined) => void): Unsub;
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
}
