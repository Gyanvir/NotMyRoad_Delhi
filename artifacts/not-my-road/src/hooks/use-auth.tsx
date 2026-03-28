import { createContext, useContext, useCallback, ReactNode } from "react";
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

  const { data: user, isLoading } = useGetCurrentUser({
    query: { retry: false },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const refetchUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
  }, [queryClient]);

  const login = useCallback(
    async (input: LoginInput) => {
      await loginMutation.mutateAsync({ data: input });
      refetchUser();
    },
    [loginMutation, refetchUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await registerMutation.mutateAsync({ data: input });
      refetchUser();
    },
    [registerMutation, refetchUser],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    refetchUser();
  }, [logoutMutation, refetchUser]);

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
