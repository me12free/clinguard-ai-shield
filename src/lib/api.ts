/**
 * ClinGuard API client (Laravel backend, MySQL). No Supabase.
 *
 * Base URL: `VITE_API_URL` from the project root `.env` (Vite injects at build/dev).
 * - **Recommended (dev):** leave `VITE_API_URL` empty → requests use same-origin paths (`/api/...`)
 *   and `vite.config.ts` proxies to Laravel (`VITE_PROXY_TARGET`, default http://127.0.0.1:8000).
 * - **Direct API:** set `VITE_API_URL=http://localhost:8000` (same hostname as you use in the browser
 *   for the SPA, e.g. avoid mixing `localhost` and `127.0.0.1`).
 */

/** Resolve base URL at request time (HMR-safe). Empty string = relative to current origin (dev proxy). */
export function getApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return "";
  }
  return String(raw).replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  const base = getApiUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base === "") {
    return p;
  }
  return `${base}${p}`;
}

/** Same rules as internal requests. Use for one-off `fetch` calls (e.g. public `/api/hello`). */
export function getApiEndpoint(path: string): string {
  return buildUrl(path);
}

const getToken = (): string | null => localStorage.getItem("auth_token");

export interface UserRole {
  role_name: string;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role_id?: number | null;
  organization_id?: number | null;
  role?: UserRole | null;
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
  engine_error?: string | null;
  /** False when OPENAI_API_KEY is missing. Then `response` is a placeholder, not a model reply. */
  openai_configured?: boolean;
}

export interface DetectResponse {
  spans: { start: number; end: number; category: string; text?: string }[];
  /** Set when Laravel could not get a successful response from the Python engine. */
  engine_error?: string | null;
}

export interface PolicyRow {
  id: number;
  organization_id: number;
  policy_name: string;
  phi_categories: string[] | null;
  enforcement_action: string;
  confidence_threshold: string | number;
  created_at?: string;
  updated_at?: string;
  organization?: { id: number; name: string };
}

export interface AuditEventRow {
  id: number;
  user_id: number | null;
  organization_id: number | null;
  event_type: string;
  detected_categories: string[] | null;
  created_at?: string;
  user?: { id: number; name: string; email: string } | null;
}

/** Saved chat turns (redacted prompt + response excerpt), same as POST /chat persists. */
export interface ConversationRow {
  id: number;
  prompt_redacted: string | null;
  response_summary: string | null;
  created_at?: string;
  user?: { id: number; name: string; email: string; organization_id?: number | null };
}

export interface OrganizationRow {
  id: number;
  name: string;
  registration_number?: string | null;
  subscription_tier?: string;
  configuration?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role_id: number;
  organization_id: number | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  role?: { id: number; role_name: string };
  organization?: { id: number; name: string };
}

export interface RoleRow {
  id: number;
  role_name: string;
  permissions?: string[];
}

async function request<T>(
  path: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const { requireAuth = false, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (requireAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const url = buildUrl(path);
  const res = await fetch(url, { ...init, headers, credentials: "include" });
  if (res.status === 401 && requireAuth) {
    localStorage.removeItem("auth_token");
    window.dispatchEvent(new Event("auth:logout"));
  }
  if (!res.ok) {
    const body = await res.text();
    let message = "Request failed";
    try {
      const j = JSON.parse(body) as { message?: string; errors?: Record<string, string[]> };
      if (j.message) {
        message = j.message;
      } else if (j.errors && typeof j.errors === "object") {
        message = Object.values(j.errors)
          .flat()
          .join(" ");
      } else {
        message = body || message;
      }
    } catch {
      message = body || message;
    }
    if (res.status === 419 || /Page Expired|CSRF token/i.test(message)) {
      message =
        "Session expired or CSRF mismatch (419). If you set VITE_API_URL, use the same hostname as this page (localhost vs 127.0.0.1), or leave VITE_API_URL empty to use the dev proxy. See .env.example.";
    } else if (body.trimStart().startsWith("<!DOCTYPE") || body.trimStart().startsWith("<html")) {
      message = `Server returned HTML instead of JSON (${res.status}). Check VITE_API_URL / proxy and CORS.`;
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

  getPolicies(organizationId?: number): Promise<{ data: PolicyRow[] }> {
    const q = organizationId != null ? `?organization_id=${organizationId}` : "";
    return request<{ data: PolicyRow[] }>(`/api/policies${q}`, { requireAuth: true });
  },

  createPolicy(body: {
    organization_id?: number;
    policy_name: string;
    phi_categories?: string[];
    enforcement_action?: string;
    confidence_threshold?: number;
  }): Promise<PolicyRow> {
    return request<PolicyRow>("/api/policies", {
      method: "POST",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  updatePolicy(
    id: number,
    body: Partial<{
      policy_name: string;
      phi_categories: string[];
      enforcement_action: string;
      confidence_threshold: number;
    }>
  ): Promise<PolicyRow> {
    return request<PolicyRow>(`/api/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  deletePolicy(id: number): Promise<void> {
    return request<void>(`/api/policies/${id}`, { method: "DELETE", requireAuth: true });
  },

  /** Requires `audit` permission; optional org filter for system admin. */
  getAuditEvents(organizationId?: number): Promise<{ data: AuditEventRow[] }> {
    const q = organizationId != null ? `?organization_id=${organizationId}` : "";
    return request<{ data: AuditEventRow[] }>(`/api/audit-events${q}`, { requireAuth: true });
  },

  /**
   * Conversations: own rows (clinician), org-wide (security admin), or all / filtered by org (system admin).
   */
  getConversations(organizationId?: number): Promise<{ data: ConversationRow[] }> {
    const q = organizationId != null ? `?organization_id=${organizationId}` : "";
    return request<{ data: ConversationRow[] }>(`/api/conversations${q}`, { requireAuth: true });
  },

  getOrganizations(): Promise<{ data: OrganizationRow[] }> {
    return request<{ data: OrganizationRow[] }>("/api/organizations", { requireAuth: true });
  },

  createOrganization(body: {
    name: string;
    registration_number?: string | null;
    subscription_tier?: string;
    configuration?: Record<string, unknown> | null;
  }): Promise<OrganizationRow> {
    return request<OrganizationRow>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  updateOrganization(
    id: number,
    body: Partial<{ name: string; registration_number: string | null; subscription_tier: string; configuration: Record<string, unknown> | null }>
  ): Promise<OrganizationRow> {
    return request<OrganizationRow>(`/api/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  deleteOrganization(id: number): Promise<void> {
    return request<void>(`/api/organizations/${id}`, { method: "DELETE", requireAuth: true });
  },

  getAdminUsers(): Promise<{ data: AdminUserRow[] }> {
    return request<{ data: AdminUserRow[] }>("/api/admin/users", { requireAuth: true });
  },

  createAdminUser(body: {
    name: string;
    email: string;
    password: string;
    role_id: number;
    organization_id: number;
  }): Promise<AdminUserRow> {
    return request<AdminUserRow>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  updateAdminUser(
    id: number,
    body: Partial<{ name: string; email: string; password: string; role_id: number; organization_id: number }>
  ): Promise<AdminUserRow> {
    return request<AdminUserRow>(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  deleteAdminUser(id: number): Promise<void> {
    return request<void>(`/api/admin/users/${id}`, { method: "DELETE", requireAuth: true });
  },

  getRoles(): Promise<{ data: RoleRow[] }> {
    return request<{ data: RoleRow[] }>("/api/roles", { requireAuth: true });
  },
};
