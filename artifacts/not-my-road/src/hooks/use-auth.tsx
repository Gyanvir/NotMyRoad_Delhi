import { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { useGetCurrentUser, useLogin, useLogout, useRegister, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, LoginInput, RegisterInput } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: user, isLoading: isQueryLoading, isFetching } = useGetCurrentUser({
    query: { retry: false },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const refetchUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    await queryClient.refetchQueries({ queryKey: getGetCurrentUserQueryKey() });
  }, [queryClient]);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsTransitioning(true);
      try {
        await loginMutation.mutateAsync({ data: input });
        await refetchUser();
      } finally {
        setIsTransitioning(false);
      }
    },
    [loginMutation, refetchUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsTransitioning(true);
      try {
        await registerMutation.mutateAsync({ data: input });
        await refetchUser();
      } finally {
        setIsTransitioning(false);
      }
    },
    [registerMutation, refetchUser],
  );

  const logout = useCallback(async () => {
    setIsTransitioning(true);
    try {
      await logoutMutation.mutateAsync();
      await refetchUser();
    } finally {
      setIsTransitioning(false);
    }
  }, [logoutMutation, refetchUser]);

  const isLoading = isQueryLoading || isFetching || isTransitioning;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
