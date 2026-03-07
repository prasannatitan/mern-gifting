import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "SUPER_ADMIN" | "CEE" | "VENDOR" | "STORE_OWNER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const STORAGE_KEY = "tanishq-auth";

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isVendor: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { user: User; token: string };
      if (data.user && data.token) {
        setState({ user: data.user, token: data.token });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback((token: string, user: User) => {
    setState({ token, user });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, token: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    isAdmin: state.user?.role === "CEE" || state.user?.role === "SUPER_ADMIN",
    isVendor: state.user?.role === "VENDOR",
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
