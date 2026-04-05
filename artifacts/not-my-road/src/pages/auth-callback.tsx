import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError("OAuth sign-in failed. Please try again.");
          return;
        }
        const res = await fetch("/api/auth/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access_token: session.access_token }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Sign-in failed. Please try again.");
          return;
        }
        await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        await queryClient.refetchQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/dashboard");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    };
    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button onClick={() => setLocation("/login")} className="text-primary hover:underline text-sm">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
