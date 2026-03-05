/**
 * ClinGuard API client. All data and auth via Laravel backend (MySQL); no Supabase.
 * Base URL: VITE_API_URL (default http://127.0.0.1:8000).
 */

export const getApiUrl = (): string =>
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const apiUrl = getApiUrl();

const getToken = (): string | null => localStorage.getItem("auth_token");

export interface User {
  id: number;
  name: string;
  email: string;
  role_id?: number | null;
  organization_id?: number | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChatResponse {
  response: string;
  spans: { start: number; end: number; category: string; text?: string }[];
  rag_context: { content?: string; text?: string }[];
  redacted_prompt: string;
}

export interface DetectResponse {
  spans: { start: number; end: number; category: string; text?: string }[];
}

async function request<T>(
  path: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const { requireAuth = false, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (requireAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${apiUrl}${path}`, { ...init, headers, credentials: "include" });
  if (res.status === 401 && requireAuth) {
    localStorage.removeItem("auth_token");
    window.dispatchEvent(new Event("auth:logout"));
  }
  if (!res.ok) {
    const body = await res.text();
    let message = "Request failed";
    try {
      const j = JSON.parse(body);
      message = j.message ?? j.errors ? Object.values(j.errors).flat().join(" ") : body || message;
    } catch {
      message = body || message;
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(name: string, email: string, password: string, password_confirmation?: string): Promise<LoginResponse> {
    return request<LoginResponse>("/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: password_confirmation ?? password,
      }),
    });
  },

  getUser(): Promise<User | null> {
    return request<User>("/api/user", { requireAuth: true }).catch(() => null);
  },

  logout(): Promise<void> {
    return request<void>("/api/logout", { method: "POST", requireAuth: true }).catch(() => {});
  },

  detect(text: string): Promise<DetectResponse> {
    return request<DetectResponse>("/api/detect", {
      method: "POST",
      body: JSON.stringify({ text }),
      requireAuth: true,
    });
  },

  chat(prompt: string): Promise<ChatResponse> {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt.trim() }),
      requireAuth: true,
    });
  },
};
