/**
 * ClinGuard API client. All data and auth via Laravel backend (MySQL); no Supabase.
 * Base URL: VITE_API_URL (default http://127.0.0.1:8000).
 */

export const getApiUrl = (): string =>
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const apiUrl = getApiUrl();

const getToken = (): string | null => localStorage.getItem("auth_token");

export interface UserRole {
  id: number;
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

  chat(prompt: string, bypassPhi?: boolean): Promise<ChatResponse> {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: prompt.trim(), bypass_phi: bypassPhi === true }),
      requireAuth: true,
    });
  },

  getConversations(): Promise<{ data: { id: number; prompt_redacted: string | null; response_summary: string | null; created_at: string }[] }> {
    return request("/api/conversations", { requireAuth: true });
  },

  getPolicies(): Promise<{ data: Policy[] }> {
    return request("/api/policies", { requireAuth: true });
  },

  updatePolicy(id: number, body: Partial<PolicyUpdate>): Promise<Policy> {
    return request(`/api/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  getAuditEvents(params?: { event_type?: string }): Promise<{ data: AuditEvent[] }> {
    const q = params?.event_type ? `?event_type=${encodeURIComponent(params.event_type)}` : "";
    return request(`/api/audit-events${q}`, { requireAuth: true });
  },

  getUsers(): Promise<{ data: User[] }> {
    return request("/api/users", { requireAuth: true });
  },

  updateUser(id: number, body: Partial<{ name: string; role_id: number | null; organization_id: number | null }>): Promise<User> {
    return request(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  getOrganizations(): Promise<{ data: Organization[] }> {
    return request("/api/organizations", { requireAuth: true });
  },

  updateOrganization(id: number, body: Partial<Organization>): Promise<Organization> {
    return request(`/api/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      requireAuth: true,
    });
  },

  getReportsSummary(): Promise<ReportSummary> {
    return request<ReportSummary>("/api/reports/summary", { requireAuth: true });
  },

  async downloadReportsPdf(): Promise<Blob> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${apiUrl}/api/reports/export`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    if (!res.ok) {
      const t = await res.text();
      let message = "PDF export failed";
      try {
        const j = JSON.parse(t);
        message = j.message ?? message;
      } catch {
        if (t) message = t;
      }
      throw new Error(message);
    }
    return res.blob();
  },
};

export interface Policy {
  id: number;
  organization_id: number;
  policy_name: string;
  phi_categories: string[] | null;
  enforcement_action: string;
  confidence_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyUpdate {
  policy_name?: string;
  phi_categories?: string[];
  enforcement_action?: string;
  confidence_threshold?: number;
}

export interface AuditEvent {
  id: number;
  user_id: number | null;
  organization_id: number | null;
  event_type: string;
  detected_categories: string[] | null;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  subscription_tier?: string;
  configuration?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface ReportSummary {
  generated_at: string;
  scope: "personal" | "organization" | "global";
  scope_label: string;
  user?: { id: number; name: string; email?: string; role?: string };
  organization?: { id: number; name: string; subscription_tier?: string } | null;
  capabilities?: {
    personal_reports: boolean;
    organization_reports: boolean;
    global_reports: boolean;
  };
  kpis: Record<string, string | number | null | undefined>;
  series: {
    conversations_by_day?: { date: string; count: number }[];
    audit_by_day?: { date: string; count: number }[];
    audit_by_event_type?: { event_type: string; count: number }[];
  };
  composed_daily: { date: string; conversations: number; audit_events: number }[];
  tables: {
    recent_conversations?: {
      id: number;
      created_at: string;
      prompt_preview: string | null;
      summary_preview: string | null;
    }[];
    recent_audit_events?: {
      id: number;
      created_at: string;
      event_type: string;
      user_id: number | null;
      organization_id?: number | null;
      detected_categories?: string[] | null;
    }[];
    organizations_summary?: {
      id: number;
      name: string;
      subscription_tier?: string;
      users_count: number;
      conversations_count: number;
      audit_events_count: number;
      policies_count: number;
    }[];
    users_by_role?: { role_name: string; count: number }[];
  };
  breakdowns: {
    phi_categories_in_audits: { category: string; count: number }[];
  };
}
