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

export type ReportFilters = {
  from?: string;
  to?: string;
  organization_id?: number;
  event_types?: string[];
  user_id?: number;
  phi_categories?: string[];
  scope?: "personal" | "organization" | "global";
  include_sections?: Array<"kpis" | "series" | "breakdowns" | "tables" | "composed_daily">;
};

export interface ReportSummary {
  generated_at: string;
  scope: "personal" | "organization" | "global";
  scope_label: string;
  meta?: {
    generated_at: string;
    scope: string;
    applied_filters: {
      from: string;
      to: string;
      organization_id?: number | null;
      event_types?: string[];
      user_id?: number | null;
      phi_categories?: string[];
    };
    capabilities: {
      personal_reports: boolean;
      organization_reports: boolean;
      global_reports: boolean;
      pdf_export: boolean;
    };
  };
  capabilities: {
    personal_reports: boolean;
    organization_reports: boolean;
    global_reports: boolean;
  };
  kpis: Record<string, string | number | null>;
  series: {
    conversations_by_day?: Array<{ date: string; count: number }>;
    audit_by_day?: Array<{ date: string; count: number }>;
    audit_by_event_type?: Array<{ event_type: string; count: number }>;
  };
  composed_daily: Array<{ date: string; conversations: number; audit_events: number }>;
  tables: {
    recent_conversations?: Array<{ id: number; created_at: string; prompt_preview: string | null; summary_preview: string | null }>;
    recent_audit_events?: Array<{ id: number; created_at: string; event_type: string; user_id: number | null; organization_id?: number | null }>;
    organizations_summary?: Array<{
      id: number;
      name: string;
      subscription_tier?: string;
      users_count: number;
      conversations_count: number;
      audit_events_count: number;
      policies_count: number;
    }>;
    users_by_role?: Array<{ role_name: string; count: number }>;
  };
  breakdowns: {
    phi_categories_in_audits: Array<{ category: string; count: number }>;
  };
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
      const j = JSON.parse(body) as {
        message?: string;
        detail?: string;
        errors?: Record<string, string[]>;
      };
      if (j.message) {
        message = j.message;
      } else if (typeof j.detail === "string" && j.detail.trim() !== "") {
        message = j.detail;
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
    if ((path === "/login" || path === "/register") && res.status === 404 && /not found/i.test(message)) {
      message =
        "Auth endpoint not found. Check VITE_API_URL or dev proxy settings. You may be pointing the app to the detection engine instead of Laravel.";
    } else if (/SQLSTATE\\[HY000\\]\\s*\\[2002\\]/i.test(message) || /Connection refused.*\\bmysql\\b/i.test(message)) {
      message =
        "Backend database connection failed. Start MySQL and confirm laravel-backend/.env DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, and DB_PASSWORD are correct.";
    } else if (res.status === 419 || /Page Expired|CSRF token/i.test(message)) {
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
  getReportsSummary(filters: ReportFilters = {}): Promise<ReportSummary> {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.organization_id != null) params.set("organization_id", String(filters.organization_id));
    if (filters.user_id != null) params.set("user_id", String(filters.user_id));
    if (filters.scope) params.set("scope", filters.scope);
    (filters.event_types ?? []).forEach((v) => params.append("event_types[]", v));
    (filters.phi_categories ?? []).forEach((v) => params.append("phi_categories[]", v));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<ReportSummary>(`/api/reports/summary${suffix}`, { requireAuth: true });
  },

  async downloadReportsPdf(filters: ReportFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.organization_id != null) params.set("organization_id", String(filters.organization_id));
    if (filters.user_id != null) params.set("user_id", String(filters.user_id));
    if (filters.scope) params.set("scope", filters.scope);
    (filters.event_types ?? []).forEach((v) => params.append("event_types[]", v));
    (filters.phi_categories ?? []).forEach((v) => params.append("phi_categories[]", v));
    (filters.include_sections ?? []).forEach((v) => params.append("include_sections[]", v));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const token = getToken();
    const headers: Record<string, string> = { Accept: "application/pdf" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(buildUrl(`/api/reports/export${suffix}`), {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`PDF export failed (${res.status})`);
    }
    return res.blob();
  },

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

  chat(prompt: string, bypassPhi?: boolean): Promise<ChatResponse> {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt.trim(), bypass_phi: bypassPhi === true }),
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
