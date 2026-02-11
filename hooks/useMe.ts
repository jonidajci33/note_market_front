import { useCallback, useEffect, useState } from "react";

import { meRequest } from "@/lib/auth-api";
import type { AuthUser } from "@/store/auth";
import { useAuthStore } from "@/store/auth";

type UseMeOptions = {
  enabled?: boolean;
  fetchOnMount?: boolean;
};

type UseMeResult = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<AuthUser | null>;
};

export function useMe(options: UseMeOptions = {}): UseMeResult {
  const { enabled = true, fetchOnMount = true } = options;
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !token) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await meRequest(token);
      setUser(profile);
      return profile;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch user profile.";
      setError(message);

      if (/401|403|unauthorized|forbidden/i.test(message)) {
        clearAuth();
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, token, setUser, clearAuth]);

  useEffect(() => {
    if (!fetchOnMount || !enabled || !token || user) {
      return;
    }

    void refetch();
  }, [fetchOnMount, enabled, token, user, refetch]);

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}
