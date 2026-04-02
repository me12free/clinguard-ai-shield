import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  api,
  type User,
  type PolicyRow,
  type AuditEventRow,
  type ConversationRow,
  type OrganizationRow,
  type AdminUserRow,
  type RoleRow,
} from "@/lib/api";
import {
  hasPermission,
  roleDashboardCopy,
  roleLabel,
  isSystemAdmin,
  canManageOrganizations,
  canManageUsers,
} from "@/lib/permissions";
import {
  defaultSectionForRole,
  navItemsForRole,
  type DashboardSectionId,
} from "@/lib/dashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronDown, Menu, Pencil, ScanLine, Sparkles, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LogoutButton from "@/components/LogoutButton";
import { BrandLogo } from "@/components/BrandLogo";
import { notifyError, notifySuccess, notifyWarning } from "@/lib/feedback";
import {
  CLINICAL_AI_PHI_QUICK_PROMPTS,
  PHI_SCAN_QUICK_PROMPTS,
} from "@/lib/chatQuickPrompts";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReportsSection from "@/components/dashboard/ReportsSection";

interface Span {
  start: number;
  end: number;
  category: string;
  text?: string;
}

interface RagChunk {
  content?: string;
  text?: string;
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ClinicalChatBlock({ onConversationSaved }: { onConversationSaved?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [spans, setSpans] = useState<Span[]>([]);
  const [ragContext, setRagContext] = useState<RagChunk[]>([]);
  const [redactedPrompt, setRedactedPrompt] = useState("");
  const [error, setError] = useState("");
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const applyQuickPrompt = (text: string) => {
    setPrompt(text);
    setError("");
    try {
      promptRef.current?.focus();
    } catch {
      /* ignore */
    }
  };
  const [bypassPhi, setBypassPhi] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) {
      notifyWarning("Enter a message", "Add a prompt before sending.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.chat(prompt, bypassPhi);
      setResponse(data.response ?? "");
      setSpans(data.spans ?? []);
      setRagContext(data.rag_context ?? []);
      setRedactedPrompt(data.redacted_prompt ?? "");
      setOpenaiConfigured(data.openai_configured ?? true);
      onConversationSaved?.();
      notifySuccess("Message processed", "PHI redaction applied; conversation saved to history.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      notifyError("Chat request failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = () => {
    if (hasPermission(user, "view_own_conversations")) api.getConversations().then((r) => setConversations(r.data)).catch(() => {});
  };
  const loadPolicies = () => {
    if (hasPermission(user, "policies")) api.getPolicies().then((r) => setPolicies(r.data)).catch(() => {});
  };
  const loadAudit = () => {
    if (hasPermission(user, "audit")) api.getAuditEvents().then((r) => setAuditEvents(r.data)).catch(() => {});
  };
  const loadUsers = () => {
    if (hasPermission(user, "users")) api.getUsers().then((r) => setUsers(r.data)).catch(() => {});
  };
  const loadOrgs = () => {
    if (hasPermission(user, "organizations")) api.getOrganizations().then((r) => setOrganizations(r.data)).catch(() => {});
  };

  const showChat = !user || hasPermission(user, "chat") || hasPermission(user, "detect");
  const showConversations = !!user && hasPermission(user, "view_own_conversations");
  const showPolicies = !!user && hasPermission(user, "policies");
  const showAudit = !!user && hasPermission(user, "audit");
  const showUsers = !!user && hasPermission(user, "users");
  const showOrgs = !!user && hasPermission(user, "organizations");
  const showReports =
    !!user &&
    (hasPermission(user, "view_own_conversations") ||
      hasPermission(user, "audit") ||
      hasPermission(user, "organizations"));

  return (
    <div className="space-y-4">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">Compose</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Sensitive details are detected and removed on the server before your message goes to the AI. Add{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">OPENAI_API_KEY</code> in Laravel for full replies.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-medium text-foreground">PHI quick prompts (tap to fill)</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {CLINICAL_AI_PHI_QUICK_PROMPTS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-auto min-h-9 justify-start whitespace-normal py-2 text-left text-xs font-normal sm:max-w-[220px]"
                  onClick={() => applyQuickPrompt(p.fullText)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            ref={promptRef}
            placeholder="Clinical question or note excerpt…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="min-h-[120px] resize-y text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleSend} disabled={loading} className="min-w-[100px]">
              {loading ? "Sending…" : "Send"}
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {redactedPrompt && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outbound message (after redaction)</CardTitle>
            <CardDescription className="text-xs">This is what the external model receives as the user turn.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 border border-border/60 p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {redactedPrompt}
            </div>
          </CardContent>
        </Card>
      )}

      {response && openaiConfigured === false && (
        <Alert className="border-amber-500/40 bg-amber-500/[0.06]">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-950 dark:text-amber-100 text-sm">OpenAI not configured</AlertTitle>
          <AlertDescription className="text-xs text-amber-900/90 dark:text-amber-100/85">
            Add <code className="rounded bg-background/80 px-1">OPENAI_API_KEY</code> to Laravel <code className="rounded bg-background/80 px-1">.env</code> and run{" "}
            <code className="rounded bg-background/80 px-1">php artisan config:clear</code>. Detection and redaction still run.
          </AlertDescription>
        </Alert>
      )}

      {response && openaiConfigured === true && (
        <Card className="border-border/80 shadow-sm border-l-4 border-l-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assistant reply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm">
              {response}
            </div>
          </CardContent>
        </Card>
      )}

      {spans.length > 0 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detected spans ({spans.length})</CardTitle>
            <CardDescription className="text-xs">Original prompt highlighting for review only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {(() => {
                const sorted = [...spans].sort((a, b) => a.start - b.start);
                const parts: React.ReactNode[] = [];
                let last = 0;
                sorted.forEach((s, i) => {
                  if (s.start > last) parts.push(prompt.slice(last, s.start));
                  parts.push(
                    <mark key={i} className="bg-amber-200/90 dark:bg-amber-900/50 rounded px-0.5" title={s.category}>
                      {prompt.slice(s.start, s.end)}
                    </mark>
                  );
                  last = s.end;
                });
                if (last < prompt.length) parts.push(prompt.slice(last));
                return parts;
              })()}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 border-t border-border/60 pt-3 max-h-48 overflow-y-auto">
              {spans.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <Badge variant="secondary" className="shrink-0 font-normal text-[10px]">
                    {s.category}
                  </Badge>
                  <span className="break-all">{prompt.slice(s.start, s.end)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {response && openaiConfigured === true && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retrieved context (RAG)</CardTitle>
            <CardDescription className="text-xs">
              {ragContext.length > 0
                ? "Snippet matches from the clinical knowledge store, added to the system prompt for grounding."
                : "No snippets returned for this message. RAG is implemented in the Python engine (POST /rag). If this stays empty, check that the engine is running, DETECTION_ENGINE_URL in Laravel matches it, and chromadb plus sentence-transformers are installed in the engine venv."}
            </CardDescription>
          </CardHeader>
          {ragContext.length > 0 && (
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {ragContext.map((r, i) => (
                  <li key={i} className="border-l-2 border-primary/25 py-1 pl-3 text-xs leading-relaxed">
                    {r.content ?? r.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function ChatHistoryBlock({
  refreshKey,
  organizationFilter,
  showAuthor,
}: {
  refreshKey: number;
  /** Omit = all accessible rows; number = filter org (system admin). */
  organizationFilter?: number;
  showAuthor: boolean;
}) {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res =
          organizationFilter !== undefined
            ? await api.getConversations(organizationFilter)
            : await api.getConversations();
        if (!cancelled) setRows(res.data ?? []);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Could not load history";
          setError(msg);
          notifyError("Could not load chat history", msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, organizationFilter]);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Saved conversations</CardTitle>
        <CardDescription className="text-xs">
          {showAuthor
            ? "Organization-scoped or all chats (role-dependent). Redacted prompts only."
            : "Your saved chats. Persists across refresh."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            No history yet. Send a message in <strong className="text-foreground">New chat</strong>.
          </p>
        )}
        {!loading && rows.length > 0 && (
          <ScrollArea className="h-[min(65vh,480px)] pr-3">
            <div className="space-y-3">
              {rows.map((row) => {
                const open = expandedId === row.id;
                const when = row.created_at ? new Date(row.created_at).toLocaleString() : "N/A";
                const preview = (row.prompt_redacted ?? "").slice(0, 160);
                const respPrev = (row.response_summary ?? "").slice(0, 200);
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-border/80 bg-card/50 p-4 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-wrap justify-between gap-2 items-start">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        #{row.id} · {when}
                        {showAuthor && row.user && (
                          <span className="block text-foreground font-sans mt-0.5">
                            {row.user.name} · {row.user.email}
                          </span>
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs -mr-2"
                        onClick={() => setExpandedId(open ? null : row.id)}
                      >
                        {open ? "Less" : "Details"}
                      </Button>
                    </div>
                    <p className="mt-2 text-muted-foreground line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed">
                      {preview}
                      {preview.length >= 160 ? "…" : ""}
                    </p>
                    {open && (
                      <div className="mt-4 space-y-3 border-t border-border/60 pt-4 text-left">
                        <div>
                          <p className="text-[11px] font-medium text-foreground mb-1 uppercase tracking-wide">Redacted prompt</p>
                          <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed font-mono bg-muted/40 rounded-md p-3">
                            {row.prompt_redacted ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-foreground mb-1 uppercase tracking-wide">Response summary</p>
                          <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">{row.response_summary ?? "N/A"}</p>
                        </div>
                      </div>
                    )}
                    {!open && respPrev && (
                      <p className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 italic line-clamp-2">
                        {respPrev}
                        {respPrev.length >= 200 ? "…" : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function PhiScanBlock() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [spans, setSpans] = useState<Span[]>([]);
  const [error, setError] = useState("");
  const [engineError, setEngineError] = useState<string | null>(null);
  const [didScan, setDidScan] = useState(false);
  const scanTextRef = useRef<HTMLTextAreaElement | null>(null);

  const applyScanSample = (sample: string) => {
    setText(sample);
    setDidScan(false);
    setError("");
    try {
      scanTextRef.current?.focus();
    } catch {
      /* ignore */
    }
  };

  const run = async () => {
    if (!text.trim()) {
      notifyWarning("Enter text to scan", "Paste clinical text first.");
      return;
    }
    setLoading(true);
    setError("");
    setEngineError(null);
    try {
      const data = await api.detect(text);
      setSpans(data.spans ?? []);
      setEngineError(data.engine_error ?? null);
      setDidScan(true);
      if (data.engine_error) {
        notifyWarning("Detection engine issue", data.engine_error);
      } else {
        const n = (data.spans ?? []).length;
        const scanMsg =
          n === 0 ? "No PHI spans returned for this text." : "Found " + String(n) + " span(s).";
        notifySuccess("Scan complete", scanMsg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Detection failed";
      setError(msg);
      notifyError("PHI scan failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Detection-only scan</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Calls the PHI engine without invoking the chat model. Use for quick validation of pasted text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
            <ScanLine className="h-3.5 w-3.5 shrink-0 text-primary" />
            Sample text (tap to load, then Run scan)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {PHI_SCAN_QUICK_PROMPTS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto min-h-9 justify-start whitespace-normal py-2 text-left text-xs font-normal sm:max-w-[220px]"
                onClick={() => applyScanSample(p.fullText)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          ref={scanTextRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDidScan(false);
          }}
          rows={8}
          placeholder="Paste clinical text to analyze…"
          className="text-sm leading-relaxed min-h-[180px]"
        />
        <Button type="button" onClick={run} disabled={loading} variant="secondary">
          {loading ? "Scanning…" : "Run scan"}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {engineError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-2">
            <p className="font-medium text-destructive">Engine unreachable</p>
            <p className="text-muted-foreground text-xs break-words">{engineError}</p>
            <p className="text-[11px] text-muted-foreground">
              Start <code className="bg-muted px-1 rounded">uvicorn</code> and align <code className="bg-muted px-1 rounded">DETECTION_ENGINE_URL</code> in Laravel.
            </p>
          </div>
        )}
        {text.trim() === "" && <p className="text-xs text-muted-foreground">Enter text above, then run the scan.</p>}
        {didScan && !error && !engineError && spans.length === 0 && (
          <p className="text-sm text-muted-foreground rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
            No spans returned for this text.
          </p>
        )}
        {spans.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
            <p className="font-medium text-foreground mb-3 text-xs uppercase tracking-wide">{spans.length} match(es)</p>
            <ul className="space-y-2 text-xs text-muted-foreground max-h-64 overflow-y-auto">
              {spans.map((s, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                  <Badge variant="outline" className="w-fit shrink-0 font-normal">
                    {s.category}
                  </Badge>
                  <span className="text-foreground break-all">“{text.slice(s.start, s.end)}”</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PolicyDraft = {
  policy_name: string;
  phi_categories_str: string;
  enforcement_action: string;
  confidence_str: string;
};

function parsePhiCategoriesCsv(s: string): string[] {
  return s
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function PoliciesBlock({
  user,
  policies,
  organizations,
  onRefresh,
}: {
  user: User;
  policies: PolicyRow[];
  organizations: OrganizationRow[];
  onRefresh: (organizationId?: number) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<number, PolicyDraft>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [orgScope, setOrgScope] = useState<string>("all");

  const [newPolicy, setNewPolicy] = useState({
    policy_name: "",
    phi_categories_str: "",
    enforcement_action: "redact",
    confidence_str: "0.85",
  });

  const sys = isSystemAdmin(user);
  const selectedOrgForCreate =
    sys && orgScope !== "all" ? Number.parseInt(orgScope, 10) : user.organization_id ?? undefined;

  const refreshScope = () => onRefresh(sys && orgScope !== "all" ? Number.parseInt(orgScope, 10) : undefined);

  const draftFor = (p: PolicyRow): PolicyDraft =>
    drafts[p.id] ?? {
      policy_name: p.policy_name,
      phi_categories_str: (p.phi_categories ?? []).join(", "),
      enforcement_action: p.enforcement_action ?? "redact",
      confidence_str: String(p.confidence_threshold ?? "0.85"),
    };

  const setDraft = (id: number, partial: Partial<PolicyDraft>) => {
    setDrafts((prev) => {
      const base = policies.find((x) => x.id === id);
      if (!base) return prev;
      const cur: PolicyDraft = prev[id] ?? {
        policy_name: base.policy_name,
        phi_categories_str: (base.phi_categories ?? []).join(", "),
        enforcement_action: base.enforcement_action ?? "redact",
        confidence_str: String(base.confidence_threshold ?? "0.85"),
      };
      return { ...prev, [id]: { ...cur, ...partial } };
    });
  };

  const save = async (p: PolicyRow) => {
    const d = draftFor(p);
    const n = Number.parseFloat(d.confidence_str);
    if (Number.isNaN(n) || n < 0 || n > 1) {
      const msg = "Confidence threshold must be between 0 and 1.";
      setErr(msg);
      notifyError("Invalid threshold", msg);
      return;
    }
    if (!d.policy_name.trim()) {
      const msg = "Policy name required.";
      setErr(msg);
      notifyError("Validation", msg);
      return;
    }
    setErr("");
    setSaving(p.id);
    try {
      await api.updatePolicy(p.id, {
        policy_name: d.policy_name.trim(),
        phi_categories: parsePhiCategoriesCsv(d.phi_categories_str),
        enforcement_action: d.enforcement_action || "redact",
        confidence_threshold: n,
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      await refreshScope();
      notifySuccess("Policy updated", '"' + d.policy_name.trim() + '" saved.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setErr(msg);
      notifyError("Could not update policy", msg);
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this policy? This cannot be undone.")) return;
    setErr("");
    try {
      await api.deletePolicy(id);
      await refreshScope();
      notifySuccess("Policy deleted", "The policy was removed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setErr(msg);
      notifyError("Could not delete policy", msg);
    }
  };

  const create = async () => {
    if (!newPolicy.policy_name.trim()) {
      const msg = "Policy name required.";
      setErr(msg);
      notifyError("Validation", msg);
      return;
    }
    if (!selectedOrgForCreate) {
      const msg = "Select an organization (system admin) or ensure your account has an organization.";
      setErr(msg);
      notifyError("Organization required", msg);
      return;
    }
    const n = Number.parseFloat(newPolicy.confidence_str);
    if (Number.isNaN(n) || n < 0 || n > 1) {
      const msg = "Confidence threshold must be between 0 and 1.";
      setErr(msg);
      notifyError("Invalid threshold", msg);
      return;
    }
    setCreating(true);
    setErr("");
    const createdName = newPolicy.policy_name.trim();
    try {
      await api.createPolicy({
        policy_name: createdName,
        organization_id: sys ? selectedOrgForCreate : undefined,
        phi_categories: parsePhiCategoriesCsv(newPolicy.phi_categories_str),
        enforcement_action: newPolicy.enforcement_action || "redact",
        confidence_threshold: n,
      });
      setNewPolicy({
        policy_name: "",
        phi_categories_str: "",
        enforcement_action: "redact",
        confidence_str: "0.85",
      });
      await refreshScope();
      notifySuccess("Policy created", '"' + createdName + '" was added.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      setErr(msg);
      notifyError("Could not create policy", msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {sys && organizations.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label className="text-xs">Filter by organization</Label>
            <Select
              value={orgScope}
              onValueChange={(v) => {
                setOrgScope(v);
                void onRefresh(v === "all" ? undefined : Number.parseInt(v, 10));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Collapsible defaultOpen={false}>
        <Card className="border-border/80 shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group w-full text-left outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">Create policy</CardTitle>
                  <CardDescription className="text-xs">
                    Matches DB: policy_name, organization_id, phi_categories (array), enforcement_action, confidence_threshold (0–1).
                  </CardDescription>
                </div>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-4 sm:grid-cols-2 max-w-4xl pt-0">
              {sys && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Organization</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Use the filter above to choose which org this policy belongs to (or pick a specific org in the filter).
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Policy name</Label>
                <Input
                  value={newPolicy.policy_name}
                  onChange={(e) => setNewPolicy((s) => ({ ...s, policy_name: e.target.value }))}
                  placeholder="e.g. Default PHI policy"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PHI categories</Label>
                <Input
                  value={newPolicy.phi_categories_str}
                  onChange={(e) => setNewPolicy((s) => ({ ...s, phi_categories_str: e.target.value }))}
                  placeholder="comma-separated e.g. NAME, DOB, MRN"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Enforcement action</Label>
                <Select
                  value={newPolicy.enforcement_action}
                  onValueChange={(v) => setNewPolicy((s) => ({ ...s, enforcement_action: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redact">redact</SelectItem>
                    <SelectItem value="block">block</SelectItem>
                    <SelectItem value="alert">alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Confidence threshold</Label>
                <Input
                  value={newPolicy.confidence_str}
                  onChange={(e) => setNewPolicy((s) => ({ ...s, confidence_str: e.target.value }))}
                  placeholder="0.85"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => void create()} disabled={creating}>
                  {creating ? "Creating…" : "Create policy"}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">PHI policies</CardTitle>
          <CardDescription className="text-xs">Full update. All fields match the policies table.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {err && <p className="text-destructive text-sm">{err}</p>}
          {policies.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center border border-dashed rounded-lg">No policies in this view.</p>
          ) : (
            <div className="rounded-xl border border-border/80 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {sys && <TableHead className="text-xs font-medium min-w-[100px]">Org</TableHead>}
                    <TableHead className="text-xs font-medium min-w-[140px]">Policy name</TableHead>
                    <TableHead className="text-xs font-medium min-w-[120px]">Enforcement</TableHead>
                    <TableHead className="text-xs font-medium min-w-[160px]">PHI categories</TableHead>
                    <TableHead className="w-[100px] text-xs font-medium">Threshold</TableHead>
                    <TableHead className="w-[90px]" />
                    <TableHead className="w-[70px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((p) => {
                    const d = draftFor(p);
                    return (
                      <TableRow key={p.id}>
                        {sys && (
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {p.organization?.name ?? p.organization_id}
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            className="h-9 text-sm min-w-[120px]"
                            value={d.policy_name}
                            onChange={(e) => setDraft(p.id, { policy_name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={d.enforcement_action}
                            onValueChange={(v) => setDraft(p.id, { enforcement_action: v })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="redact">redact</SelectItem>
                              <SelectItem value="block">block</SelectItem>
                              <SelectItem value="alert">alert</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-9 text-xs"
                            value={d.phi_categories_str}
                            onChange={(e) => setDraft(p.id, { phi_categories_str: e.target.value })}
                            placeholder="comma-separated"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-9 text-sm"
                            value={d.confidence_str}
                            onChange={(e) => setDraft(p.id, { confidence_str: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={saving === p.id}
                            onClick={() => save(p)}
                            className="w-full"
                          >
                            {saving === p.id ? "…" : "Save"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void remove(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditBlock({
  events,
  organizations,
  orgFilter,
  onOrgFilterChange,
  showOrgFilter,
}: {
  events: AuditEventRow[];
  organizations: OrganizationRow[];
  orgFilter: string;
  onOrgFilterChange: (v: string) => void;
  showOrgFilter: boolean;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-base">Audit log</CardTitle>
          <CardDescription className="text-xs">Security-relevant events (policy, chat, users, orgs).</CardDescription>
        </div>
        {showOrgFilter && organizations.length > 0 && (
          <div className="space-y-2 max-w-xs">
            <Label className="text-xs">Organization</Label>
            <Select value={orgFilter} onValueChange={onOrgFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center border border-dashed rounded-lg">No events in this view.</p>
        ) : (
          <div className="rounded-xl border border-border/80 max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs w-[150px]">Time</TableHead>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-[11px] font-mono">
                      {ev.created_at ? new Date(ev.created_at).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{ev.event_type}</TableCell>
                    <TableCell className="text-sm">{ev.user?.name ?? ev.user?.email ?? "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewBlock({
  user,
  policiesCount,
  auditCount,
  canPolicies,
  canAudit,
  canManageOrgs,
  canManageUsers,
  canReports,
  onGo,
}: {
  user: User;
  policiesCount: number;
  auditCount: number;
  canPolicies: boolean;
  canAudit: boolean;
  canManageOrgs: boolean;
  canManageUsers: boolean;
  canReports: boolean;
  onGo: (id: DashboardSectionId) => void;
}) {
  const roleName = user.role?.role_name;
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wide">Role</CardDescription>
            <CardTitle className="text-2xl font-semibold">{roleLabel(roleName)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wide">Policies</CardDescription>
            <CardTitle className="text-2xl font-semibold">{canPolicies ? policiesCount : "N/A"}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wide">Audit events</CardDescription>
            <CardTitle className="text-2xl font-semibold">{canAudit ? auditCount : "N/A"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Shortcuts</CardTitle>
          <CardDescription className="text-xs">Jump to common tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onGo("clinical")}>
            Clinical AI
          </Button>
          <Button variant="outline" size="sm" onClick={() => onGo("phi")}>
            PHI scan
          </Button>
          {canPolicies && (
            <Button variant="outline" size="sm" onClick={() => onGo("policies")}>
              Policies
            </Button>
          )}
          {canAudit && (
            <Button variant="outline" size="sm" onClick={() => onGo("audit")}>
              Audit log
            </Button>
          )}
          {canManageOrgs && (
            <Button variant="outline" size="sm" onClick={() => onGo("organizations")}>
              Organizations
            </Button>
          )}
          {canManageUsers && (
            <Button variant="outline" size="sm" onClick={() => onGo("users")}>
              Users
            </Button>
          )}
          {canReports && (
            <Button variant="outline" size="sm" onClick={() => onGo("reports")}>
              Reports
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Use <strong className="text-foreground">Clinical AI</strong> for redacted LLM assistance and <strong className="text-foreground">PHI scan</strong> for
            detection-only checks. Compliance tools are available from the sidebar.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function orgConfigToString(o: OrganizationRow): string {
  if (o.configuration == null) return "";
  try {
    return JSON.stringify(o.configuration, null, 2);
  } catch {
    return "";
  }
}

type OrgDraft = {
  name: string;
  registration_number: string;
  subscription_tier: string;
  configuration_json: string;
};

function OrganizationsAdminBlock({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<OrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [drafts, setDrafts] = useState<Record<number, OrgDraft>>({});
  const [createForm, setCreateForm] = useState<OrgDraft>({
    name: "",
    registration_number: "",
    subscription_tier: "standard",
    configuration_json: "",
  });

  const load = async () => {
    const res = await api.getOrganizations();
    setRows(res.data ?? []);
  };

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!c) {
          const msg = e instanceof Error ? e.message : "Failed";
          setErr(msg);
          notifyError("Could not load organizations", msg);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const draftFor = (o: OrganizationRow): OrgDraft =>
    drafts[o.id] ?? {
      name: o.name,
      registration_number: o.registration_number ?? "",
      subscription_tier: o.subscription_tier ?? "standard",
      configuration_json: orgConfigToString(o),
    };

  const setDraft = (id: number, partial: Partial<OrgDraft>) => {
    setDrafts((prev) => {
      const o = rows.find((x) => x.id === id);
      if (!o) return prev;
      const cur = prev[id] ?? {
        name: o.name,
        registration_number: o.registration_number ?? "",
        subscription_tier: o.subscription_tier ?? "standard",
        configuration_json: orgConfigToString(o),
      };
      return { ...prev, [id]: { ...cur, ...partial } };
    });
  };

  const parseConfig = (raw: string): Record<string, unknown> | null => {
    const t = raw.trim();
    if (!t) return null;
    try {
      const parsed = JSON.parse(t) as unknown;
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      const msg = "Configuration must be a JSON object.";
      setErr(msg);
      notifyError("Invalid configuration", msg);
      return null;
    } catch {
      const msg = "Invalid JSON in configuration.";
      setErr(msg);
      notifyError("Invalid configuration", msg);
      return null;
    }
  };

  const create = async () => {
    if (!createForm.name.trim()) {
      const msg = "Name is required.";
      setErr(msg);
      notifyError("Validation", msg);
      return;
    }
    setErr("");
    const cfg = parseConfig(createForm.configuration_json);
    if (createForm.configuration_json.trim() && cfg === null) return;
    const orgName = createForm.name.trim();
    try {
      await api.createOrganization({
        name: orgName,
        registration_number: createForm.registration_number.trim() || null,
        subscription_tier: createForm.subscription_tier.trim() || "standard",
        configuration: cfg ?? undefined,
      });
      setCreateForm({
        name: "",
        registration_number: "",
        subscription_tier: "standard",
        configuration_json: "",
      });
      await load();
      onChanged();
      notifySuccess("Organization created", `"${orgName}" was added.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not create organization", msg);
    }
  };

  const saveRow = async (o: OrganizationRow) => {
    const d = draftFor(o);
    setErr("");
    const cfg = parseConfig(d.configuration_json);
    if (d.configuration_json.trim() && cfg === null) return;
    try {
      await api.updateOrganization(o.id, {
        name: d.name.trim(),
        registration_number: d.registration_number.trim() || null,
        subscription_tier: d.subscription_tier.trim() || "standard",
        configuration: cfg,
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[o.id];
        return next;
      });
      await load();
      onChanged();
      notifySuccess("Organization updated", `"${d.name.trim()}" saved.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not update organization", msg);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this organization? Only allowed when no users belong to it.")) return;
    setErr("");
    try {
      await api.deleteOrganization(id);
      await load();
      onChanged();
      notifySuccess("Organization deleted", "The organization was removed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not delete organization", msg);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6">
      {err && <p className="text-destructive text-sm">{err}</p>}
      <Collapsible defaultOpen={false}>
        <Card className="border-border/80 shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group w-full text-left outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">New organization</CardTitle>
                  <CardDescription className="text-xs">
                    Fields match <code className="text-[10px]">organizations</code>: name, registration_number, subscription_tier, configuration (JSON).
                  </CardDescription>
                </div>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-3 sm:grid-cols-2 max-w-4xl pt-0">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Organization legal name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Registration number</Label>
                <Input
                  value={createForm.registration_number}
                  onChange={(e) => setCreateForm((f) => ({ ...f, registration_number: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subscription tier</Label>
                <Input
                  value={createForm.subscription_tier}
                  onChange={(e) => setCreateForm((f) => ({ ...f, subscription_tier: e.target.value }))}
                  placeholder="standard"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Configuration (JSON object)</Label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={createForm.configuration_json}
                  onChange={(e) => setCreateForm((f) => ({ ...f, configuration_json: e.target.value }))}
                  placeholder='{ "feature_flags": { "rag": true } }'
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => void create()}>
                  Create organization
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All organizations</CardTitle>
          <CardDescription className="text-xs">Full CRUD. Deletes are blocked if users exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[120px]">Name</TableHead>
                  <TableHead className="text-xs min-w-[100px]">Reg. #</TableHead>
                  <TableHead className="text-xs min-w-[90px]">Tier</TableHead>
                  <TableHead className="text-xs min-w-[220px]">Configuration (JSON)</TableHead>
                  <TableHead className="text-xs w-[100px]" />
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => {
                  const d = draftFor(o);
                  return (
                    <TableRow key={o.id} className="align-top">
                      <TableCell>
                        <Input
                          className="h-9 text-sm"
                          value={d.name}
                          onChange={(e) => setDraft(o.id, { name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-9 text-xs"
                          value={d.registration_number}
                          onChange={(e) => setDraft(o.id, { registration_number: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-9 text-xs"
                          value={d.subscription_tier}
                          onChange={(e) => setDraft(o.id, { subscription_tier: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={3}
                          className="font-mono text-[11px] min-w-[200px]"
                          value={d.configuration_json}
                          onChange={(e) => setDraft(o.id, { configuration_json: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => void saveRow(o)}>
                          Save
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void del(o.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersAdminBlock({ organizations, onChanged }: { organizations: OrganizationRow[]; onChanged: () => void }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role_id: "", organization_id: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    organization_id: "",
  });

  const load = async () => {
    const [u, r] = await Promise.all([api.getAdminUsers(), api.getRoles()]);
    setUsers(u.data ?? []);
    setRoles(r.data ?? []);
  };

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!c) {
          const msg = e instanceof Error ? e.message : "Failed";
          setErr(msg);
          notifyError("Could not load users", msg);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    if (roles.length) {
      setForm((f) => {
        if (f.role_id) return f;
        const clinician = roles.find((x) => x.role_name === "clinician");
        return { ...f, role_id: String(clinician?.id ?? roles[0].id) };
      });
    }
  }, [roles]);

  useEffect(() => {
    if (organizations.length) {
      setForm((f) => {
        if (f.organization_id) return f;
        return { ...f, organization_id: String(organizations[0].id) };
      });
    }
  }, [organizations]);

  const createUser = async () => {
    setErr("");
    try {
      await api.createAdminUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role_id: Number.parseInt(form.role_id, 10),
        organization_id: Number.parseInt(form.organization_id, 10),
      });
      const label = form.email;
      setForm((f) => ({ ...f, name: "", email: "", password: "" }));
      await load();
      onChanged();
      notifySuccess("User created", `Account ${label} was added.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not create user", msg);
    }
  };

  const openEdit = (u: AdminUserRow) => {
    setEditId(u.id);
    setEditForm({
      name: u.name,
      email: u.email,
      password: "",
      role_id: String(u.role_id),
      organization_id: u.organization_id != null ? String(u.organization_id) : "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (editId == null) return;
    setErr("");
    try {
      const body: Parameters<typeof api.updateAdminUser>[1] = {
        name: editForm.name,
        email: editForm.email,
        role_id: Number.parseInt(editForm.role_id, 10),
        organization_id: Number.parseInt(editForm.organization_id, 10),
      };
      if (editForm.password.trim()) {
        body.password = editForm.password;
      }
      await api.updateAdminUser(editId, body);
      setEditOpen(false);
      setEditId(null);
      await load();
      onChanged();
      notifySuccess("User updated", `${editForm.email} was saved.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not update user", msg);
    }
  };

  const delUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    setErr("");
    try {
      await api.deleteAdminUser(id);
      await load();
      onChanged();
      notifySuccess("User deleted", "The account was removed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setErr(msg);
      notifyError("Could not delete user", msg);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6">
      {err && <p className="text-destructive text-sm">{err}</p>}
      <Collapsible defaultOpen={false}>
        <Card className="border-border/80 shadow-sm">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group w-full text-left outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">Create user</CardTitle>
                  <CardDescription className="text-xs">
                    Provision accounts and assign roles (system admin). Matches <code className="text-[10px]">users</code>: name, email, password (hashed server-side), role_id, organization_id.
                  </CardDescription>
                </div>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-3 sm:grid-cols-2 max-w-3xl pt-0">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={form.role_id} onValueChange={(v) => setForm((f) => ({ ...f, role_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Organization</Label>
                <Select value={form.organization_id} onValueChange={(v) => setForm((f) => ({ ...f, organization_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => void createUser()}>
                  Create user
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Directory</CardTitle>
          <CardDescription className="text-xs">Read-only timestamps; edit opens a sheet with full fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto max-h-[min(70vh,560px)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[52px]">ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Org</TableHead>
                  <TableHead className="text-xs">Verified</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="text-sm">{u.name}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell className="text-xs font-mono">{u.role?.role_name}</TableCell>
                    <TableCell className="text-xs">{u.organization?.name}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {u.email_verified_at ? new Date(u.email_verified_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive h-8 px-2" onClick={() => void delUser(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <p className="text-xs text-muted-foreground font-normal">Update user record (password optional).</p>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">New password (leave blank to keep)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={editForm.role_id} onValueChange={(v) => setEditForm((f) => ({ ...f, role_id: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Organization</Label>
              <Select value={editForm.organization_id} onValueChange={(v) => setEditForm((f) => ({ ...f, organization_id: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={() => void saveEdit()}>
              Save changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
        active
          ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "opacity-70")} />
      <span className="min-w-0">
        <span className="block font-medium leading-tight">{label}</span>
        <span className="block text-[11px] leading-snug opacity-80 mt-0.5 line-clamp-2">{description}</span>
      </span>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState("");
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventRow[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [auditOrgFilter, setAuditOrgFilter] = useState("all");
  const [convOrgFilter, setConvOrgFilter] = useState("all");
  const [conversationRefresh, setConversationRefresh] = useState(0);
  const [section, setSection] = useState<DashboardSectionId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initSection = useRef(false);

  useEffect(() => {
    initSection.current = false;
  }, [token]);

  const loadContext = useCallback(async (u: User) => {
    const canPol = hasPermission(u, "policies");
    const canAud = hasPermission(u, "audit");
    const canOrgs = canManageOrganizations(u);
    try {
      if (canPol) {
        const pr = await api.getPolicies();
        setPolicies(pr.data ?? []);
      } else setPolicies([]);
    } catch {
      setPolicies([]);
    }
    try {
      if (canAud) {
        const ar = await api.getAuditEvents();
        setAuditEvents(ar.data ?? []);
      } else setAuditEvents([]);
    } catch {
      setAuditEvents([]);
    }
    try {
      if (canOrgs) {
        const o = await api.getOrganizations();
        setOrganizations(o.data ?? []);
      } else setOrganizations([]);
    } catch {
      setOrganizations([]);
    }
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setToken(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [navigate]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadError("");
      const u = await api.getUser();
      if (cancelled) return;
      if (!u) {
        const msg = "Could not load your profile. Try logging in again.";
        setLoadError(msg);
        notifyError("Session error", msg);
        return;
      }
      setUser(u);
      await loadContext(u);
      if (!initSection.current) {
        initSection.current = true;
        setSection(defaultSectionForRole(u.role?.role_name));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadContext]);

  /** Redirect unauthenticated users. Must not return before hooks below (Rules of Hooks). */
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const roleName = user?.role?.role_name;
  const copy = roleDashboardCopy(roleName);
  const canPolicies = hasPermission(user, "policies");
  const canAudit = hasPermission(user, "audit");
  const canOrgs = canManageOrganizations(user);
  const canUsers = canManageUsers(user);
  const canReports = hasPermission(user, "view_own_conversations") || hasPermission(user, "audit") || canOrgs;
  const navItems = navItemsForRole(roleName);
  const activeSection = section ?? defaultSectionForRole(roleName);

  const refreshPolicies = useCallback(async (organizationId?: number) => {
    if (!user || !canPolicies) return;
    const pr = await api.getPolicies(organizationId);
    setPolicies(pr.data ?? []);
  }, [user, canPolicies]);

  const refreshAudit = useCallback(async () => {
    if (!user || !canAudit) return;
    const orgId =
      isSystemAdmin(user) && auditOrgFilter !== "all" ? Number.parseInt(auditOrgFilter, 10) : undefined;
    const ar = await api.getAuditEvents(orgId);
    setAuditEvents(ar.data ?? []);
  }, [user, canAudit, auditOrgFilter]);

  const reloadOrganizations = useCallback(async () => {
    if (!user || !canOrgs) return;
    const o = await api.getOrganizations();
    setOrganizations(o.data ?? []);
  }, [user, canOrgs]);

  useEffect(() => {
    if (!token || !user || !canAudit || activeSection !== "audit") return;
    void refreshAudit();
  }, [token, auditOrgFilter, activeSection, user, canAudit, refreshAudit]);

  if (!token) {
    return null;
  }

  const currentNav = navItems.find((n) => n.id === activeSection);

  const go = (id: DashboardSectionId) => {
    if (!navItems.some((n) => n.id === id)) return;
    setSection(id);
    setMobileOpen(false);
  };

  const renderMain = () => {
    if (!user) {
      return (
        <div className="space-y-4 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    switch (activeSection) {
      case "home":
        return (
          <SectionShell title="Overview" description={copy.subtitle}>
            <OverviewBlock
              user={user}
              policiesCount={policies.length}
              auditCount={auditEvents.length}
              canPolicies={canPolicies}
              canAudit={canAudit}
              canManageOrgs={canOrgs}
              canManageUsers={canUsers}
              canReports={canReports}
              onGo={go}
            />
          </SectionShell>
        );
      case "clinical":
        return (
          <SectionShell
            title="Clinical AI"
            description="Write messages safely: sensitive details are handled before anything is sent to the AI."
          >
            <Tabs defaultValue="new" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-11 p-1 bg-muted/60">
                <TabsTrigger value="new" className="rounded-lg text-sm">
                  New chat
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg text-sm">
                  History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="new" className="mt-0">
                <ClinicalChatBlock onConversationSaved={() => setConversationRefresh((n) => n + 1)} />
              </TabsContent>
              <TabsContent value="history" className="mt-0 space-y-4">
                {isSystemAdmin(user) && organizations.length > 0 && (
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-xs">Organization</Label>
                    <Select value={convOrgFilter} onValueChange={setConvOrgFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All organizations</SelectItem>
                        {organizations.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <ChatHistoryBlock
                  refreshKey={conversationRefresh}
                  organizationFilter={
                    isSystemAdmin(user) && convOrgFilter !== "all"
                      ? Number.parseInt(convOrgFilter, 10)
                      : undefined
                  }
                  showAuthor={hasPermission(user, "view_org_conversations")}
                />
              </TabsContent>
            </Tabs>
          </SectionShell>
        );
      case "phi":
        return (
          <SectionShell title="PHI scan" description="Detection-only. No LLM call.">
            <PhiScanBlock />
          </SectionShell>
        );
      case "policies":
        if (!canPolicies) return null;
        return (
          <SectionShell
            title="Policies"
            description="Create, update, or remove PHI policies. System admins can manage all organizations."
          >
            <PoliciesBlock user={user} policies={policies} organizations={organizations} onRefresh={refreshPolicies} />
          </SectionShell>
        );
      case "audit":
        if (!canAudit) return null;
        return (
          <SectionShell title="Audit log" description="Immutable trail of sensitive actions across the platform.">
            <AuditBlock
              events={auditEvents}
              organizations={organizations}
              orgFilter={auditOrgFilter}
              onOrgFilterChange={(v) => setAuditOrgFilter(v)}
              showOrgFilter={isSystemAdmin(user)}
            />
          </SectionShell>
        );
      case "organizations":
        if (!canOrgs) return null;
        return (
          <SectionShell title="Organizations" description="Create and manage tenant organizations (system admin).">
            <OrganizationsAdminBlock
              onChanged={() => {
                void loadContext(user);
                void refreshPolicies();
              }}
            />
          </SectionShell>
        );
      case "users":
        if (!canUsers) return null;
        return (
          <SectionShell title="Users" description="Directory and account management.">
            <UsersAdminBlock
              organizations={organizations}
              onChanged={() => {
                void loadContext(user);
                void refreshAudit();
              }}
            />
          </SectionShell>
        );
      case "reports":
        if (!canReports) return null;
        return (
          <SectionShell title="Reports" description="Role-scoped metrics, charts, and export-ready reporting.">
            <ReportsSection />
          </SectionShell>
        );
      default:
        return null;
    }
  };

  const sidebarNav = (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          active={activeSection === item.id}
          onClick={() => go(item.id)}
          icon={item.icon}
          label={item.label}
          description={item.description}
        />
      ))}
    </nav>
  );

  return (
    <div className="flex h-svh flex-col overflow-hidden md:flex-row bg-gradient-to-b from-background via-background to-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-svh w-[280px] shrink-0 flex-col border-r border-border/70 bg-card/90 backdrop-blur-sm">
        <div className="p-6 border-b border-border/60">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg -m-1 p-1 hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-border/50 bg-background p-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm tracking-tight truncate">ClinGuard</p>
              <p className="text-[11px] text-muted-foreground truncate">Clinical AI Shield</p>
            </div>
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{sidebarNav}</div>
        <div className="mt-auto p-4 border-t border-border/60">
          {user && (
            <p className="text-[11px] text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
          <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                  <SheetHeader className="p-6 border-b text-left">
                    <SheetTitle className="text-base">
                      <Link
                        to="/"
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <BrandLogo className="h-7 w-7 rounded-md shrink-0" />
                        ClinGuard
                      </Link>
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground font-normal">Navigate by role</p>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">{sidebarNav}</div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <h1 className="text-base font-semibold tracking-tight truncate md:text-lg">
                  {currentNav?.label ?? copy.title}
                </h1>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block max-w-xl">
                  {currentNav?.description ?? copy.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user && (
                <div className="hidden sm:flex flex-col items-end text-right mr-1">
                  <span className="text-xs font-medium truncate max-w-[140px]">{user.name}</span>
                </div>
              )}
              {roleName && (
                <Badge variant="secondary" className="font-normal text-[11px] hidden sm:inline-flex">
                  {roleLabel(roleName)}
                </Badge>
              )}
              <LogoutButton
                onLogout={() => {
                  localStorage.removeItem("auth_token");
                  navigate("/");
                }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {loadError && (
            <Card className="mb-6 border-destructive/40 bg-destructive/5">
              <CardContent className="pt-6 text-destructive text-sm">{loadError}</CardContent>
            </Card>
          )}
          <div className="mx-auto max-w-4xl xl:max-w-5xl">{renderMain()}</div>
        </main>
      </div>
    </div>
  );
}
