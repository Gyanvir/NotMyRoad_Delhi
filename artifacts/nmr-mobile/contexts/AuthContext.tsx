import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, useLogin, useRegister, useLogout } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const TOKEN_KEY = "nmr_auth_token";
const USER_KEY = "nmr_auth_user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Register token getter at module load so all API calls get the header
let _tokenRef: string | null = null;
setAuthTokenGetter(() => _tokenRef);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  useEffect(() => {
    const restore = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          _tokenRef = storedToken;
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const persist = useCallback(async (t: string, u: User) => {
    _tokenRef = t;
    setToken(t);
    setUser(u);
    await AsyncStorage.setItem(TOKEN_KEY, t);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginMutation.mutateAsync({ data: { email, password } });
    if (res.token) {
      await persist(res.token, res.user);
    }
    queryClient.invalidateQueries();
  }, [loginMutation, persist, queryClient]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await registerMutation.mutateAsync({ data: { name, email, password } });
    if (res.token) {
      await persist(res.token, res.user);
    }
    queryClient.invalidateQueries();
  }, [registerMutation, persist, queryClient]);

  const loginWithToken = useCallback(async (t: string, u: User) => {
    await persist(t, u);
    queryClient.invalidateQueries();
  }, [persist, queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore network errors on logout
    }
    _tokenRef = null;
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    queryClient.clear();
  }, [logoutMutation, queryClient]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
