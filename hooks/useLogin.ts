import { useCallback, useState } from "react";

import { loginRequest, meRequest } from "@/lib/auth-api";
import type { AuthUser } from "@/store/auth";
import { useAuthStore } from "@/store/auth";

type LoginParams = {
  email: string;
  password: string;
};

type LoginResult = {
  token: string;
  user: AuthUser;
};

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async ({ email, password }: LoginParams): Promise<LoginResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const { token, user: userFromLogin } = await loginRequest(email.trim(), password);
        const userFromMe = await meRequest(token);
        const user: AuthUser = userFromMe ?? userFromLogin ?? { email: email.trim() };

        setAuth(token, user);

        return { token, user };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to login. Please try again.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    isLoading,
    error,
    clearError,
  };
}
