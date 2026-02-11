const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

function buildUrl(path: string): string {
  if (/^http?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function pickErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const message = data.message ?? data.error ?? data.detail;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return `Request failed (${status})`;
}

async function readPayload(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export async function apiRequest<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(pickErrorMessage(payload, response.status));
  }

  return payload as TResponse;
}
