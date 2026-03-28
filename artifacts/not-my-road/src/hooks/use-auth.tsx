import { createContext, useContext, ReactNode } from "react";
import { useGetCurrentUser, useLogin, useLogout, useRegister } from "@workspace/api-client-react";
import type { User, LoginInput, RegisterInput } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  register: ReturnType<typeof useRegister>["mutateAsync"];
  logout: ReturnType<typeof useLogout>["mutateAsync"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useGetCurrentUser({
    query: {
      retry: false,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        refetch();
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        refetch();
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        refetch();
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
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
