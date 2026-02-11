import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/store/auth";

type AuthPayload = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
    user?: AuthUser;
  };
};

function extractToken(payload: AuthPayload): string | null {
  return payload.token ?? payload.accessToken ?? payload.jwt ?? payload.data?.token ?? payload.data?.accessToken ?? payload.data?.jwt ?? null;
}

function extractAuthResult(payload: AuthPayload, context: "login" | "register"): { token: string; user: AuthUser | null } {
  const token = extractToken(payload);

  if (!token) {
    throw new Error(`${context === "login" ? "Login" : "Registration"} succeeded but token was missing in the response.`);
  }

  const user = payload.user ?? payload.data?.user ?? null;
  return { token, user };
}

export async function loginRequest(email: string, password: string): Promise<{ token: string; user: AuthUser | null }> {
  const payload = await apiRequest<AuthPayload>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return extractAuthResult(payload, "login");
}

export async function registerRequest(email: string, password: string): Promise<{ token: string; user: AuthUser | null }> {
  const payload = await apiRequest<AuthPayload>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return extractAuthResult(payload, "register");
}

export function meRequest(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/v1/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
