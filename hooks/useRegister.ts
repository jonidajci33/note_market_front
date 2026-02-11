import { useCallback, useState } from "react";

import { meRequest, registerRequest } from "@/lib/auth-api";
import type { AuthUser } from "@/store/auth";
import { useAuthStore } from "@/store/auth";

type RegisterParams = {
  email: string;
  password: string;
};

type RegisterResult = {
  token: string;
  user: AuthUser;
};

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async ({ email, password }: RegisterParams): Promise<RegisterResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const normalizedEmail = email.trim();
        const { token, user: userFromRegister } = await registerRequest(normalizedEmail, password);
        const userFromMe = await meRequest(token);
        const user: AuthUser = userFromMe ?? userFromRegister ?? { email: normalizedEmail };

        setAuth(token, user);
        return { token, user };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to register. Please try again.";
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
    register,
    isLoading,
    error,
    clearError,
  };
}
