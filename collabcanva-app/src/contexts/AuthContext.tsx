import { createContext, useContext, useState, useEffect } from "react";
import {
  signup as signupApi,
  login as loginApi,
  getUserById,
  storeUser,
  getStoredUser,
  clearStoredUser,
  type AuthUser,
} from "../services/auth-api";

// Re-export AuthUser type for compatibility
export type { AuthUser };

type Ctx = {
  user: AuthUser | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>; // Not implemented yet, kept for compatibility
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Optionally verify user still exists on backend
      getUserById(storedUser.uid).then((user) => {
        if (user) {
          setUser(user);
          storeUser(user);
        } else {
          // User no longer exists, clear storage
          clearStoredUser();
          setUser(null);
        }
      }).catch(() => {
        // If verification fails, keep stored user for now
        console.warn('[AuthContext] Failed to verify stored user');
      });
    }
    setLoading(false);
  }, []);

  const signup = async (email: string, password: string, displayName?: string) => {
    const user = await signupApi(email, password, displayName);
    storeUser(user);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const user = await loginApi(email, password);
    storeUser(user);
    setUser(user);
  };

  const loginWithGoogle = async () => {
    // Google login not implemented yet - would need OAuth setup
    throw new Error('Google login not yet implemented. Please use email/password.');
  };

  const logout = async () => {
    clearStoredUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
