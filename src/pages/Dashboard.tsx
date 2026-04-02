import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, type User, type Policy, type AuditEvent, type Organization } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LogoutButton from "@/components/LogoutButton";
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

function hasPermission(user: User | null, permission: string): boolean {
  return !!user?.role?.permissions?.includes(permission);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [spans, setSpans] = useState<Span[]>([]);
  const [ragContext, setRagContext] = useState<RagChunk[]>([]);
  const [redactedPrompt, setRedactedPrompt] = useState("");
  const [error, setError] = useState("");
  const [bypassPhi, setBypassPhi] = useState(false);
  const [conversations, setConversations] = useState<{ id: number; prompt_redacted: string | null; response_summary: string | null; created_at: string }[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    const onLogout = () => {
      setToken(null);
      setUser(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    api.getUser().then(setUser).catch(() => setUser(null));
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.chat(prompt, bypassPhi);
      setResponse(data.response ?? "");
      setSpans(data.spans ?? []);
      setRagContext(data.rag_context ?? []);
      setRedactedPrompt(data.redacted_prompt ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
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
    <div className="min-h-screen bg-background p-4">
      <div className={`container mx-auto ${showReports ? "max-w-6xl" : "max-w-4xl"}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ClinGuard Dashboard</h1>
          <LogoutButton onLogout={() => { localStorage.removeItem("auth_token"); navigate("/"); }} />
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-1">
            {showChat && <TabsTrigger value="chat">Chat</TabsTrigger>}
            {showConversations && <TabsTrigger value="conversations" onClick={loadConversations}>Conversations</TabsTrigger>}
            {showPolicies && <TabsTrigger value="policies" onClick={loadPolicies}>Policies</TabsTrigger>}
            {showAudit && <TabsTrigger value="audit" onClick={loadAudit}>Audit</TabsTrigger>}
            {showUsers && <TabsTrigger value="users" onClick={loadUsers}>Users</TabsTrigger>}
            {showOrgs && <TabsTrigger value="organizations" onClick={loadOrgs}>Organizations</TabsTrigger>}
            {showReports && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          {showChat && (
            <TabsContent value="chat" className="space-y-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Clinical prompt (PHI is detected and redacted before AI)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Enter clinical note or question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bypass-phi"
                checked={bypassPhi}
                onCheckedChange={(checked) => setBypassPhi(checked === true)}
              />
              <label htmlFor="bypass-phi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Emergency bypass (no PHI redaction; allowed only if permitted)
              </label>
            </div>
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "Sending…" : "Send"}
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
        </Card>

        {redactedPrompt && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Redacted prompt sent to AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{redactedPrompt}</p>
            </CardContent>
          </Card>
        )}

        {response && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>AI response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{response}</p>
            </CardContent>
          </Card>
        )}

        {spans.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Detected PHI ({spans.length} spans)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">Highlighted in prompt:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {(() => {
                  const sorted = [...spans].sort((a, b) => a.start - b.start);
                  const parts: React.ReactNode[] = [];
                  let last = 0;
                  sorted.forEach((s, i) => {
                    if (s.start > last) parts.push(prompt.slice(last, s.start));
                    parts.push(
                      <mark key={i} className="bg-amber-200 dark:bg-amber-900/50 rounded px-0.5" title={s.category}>
                        {prompt.slice(s.start, s.end)}
                      </mark>
                    );
                    last = s.end;
                  });
                  if (last < prompt.length) parts.push(prompt.slice(last));
                  return parts;
                })()}
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-4">
                {spans.map((s, i) => (
                  <li key={i}>{s.category}: {s.text ?? prompt.slice(s.start, s.end)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {ragContext.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">RAG clinical context</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {ragContext.map((r, i) => (
                  <li key={i} className="border-l-2 pl-2 border-primary/30">
                    {r.content ?? r.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
            </TabsContent>
          )}

          {showConversations && (
            <TabsContent value="conversations">
              <Card>
                <CardHeader><CardTitle>My conversations</CardTitle></CardHeader>
                <CardContent>
                  {conversations.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Prompt (redacted)</TableHead><TableHead>Summary</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {conversations.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{new Date(c.created_at).toLocaleString()}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{c.prompt_redacted ?? "—"}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{c.response_summary ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showPolicies && (
            <TabsContent value="policies">
              <Card>
                <CardHeader><CardTitle>Policies</CardTitle></CardHeader>
                <CardContent>
                  {policies.length === 0 && <p className="text-sm text-muted-foreground">No policies.</p>}
                  <ul className="space-y-2 text-sm">
                    {policies.map((p) => (
                      <li key={p.id} className="border-b pb-2">
                        <strong>{p.policy_name}</strong> — {p.enforcement_action}, threshold: {p.confidence_threshold}
                        {p.phi_categories?.length ? ` (${p.phi_categories.join(", ")})` : ""}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showAudit && (
            <TabsContent value="audit">
              <Card>
                <CardHeader><CardTitle>Audit events</CardTitle></CardHeader>
                <CardContent>
                  {auditEvents.length === 0 && <p className="text-sm text-muted-foreground">No events.</p>}
                  <Table>
                    <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Type</TableHead><TableHead>User ID</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {auditEvents.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm">{new Date(e.created_at).toLocaleString()}</TableCell>
                          <TableCell>{e.event_type}</TableCell>
                          <TableCell>{e.user_id ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showUsers && (
            <TabsContent value="users">
              <Card>
                <CardHeader><CardTitle>Users</CardTitle></CardHeader>
                <CardContent>
                  {users.length === 0 && <p className="text-sm text-muted-foreground">No users.</p>}
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.role?.role_name ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showOrgs && (
            <TabsContent value="organizations">
              <Card>
                <CardHeader><CardTitle>Organizations</CardTitle></CardHeader>
                <CardContent>
                  {organizations.length === 0 && <p className="text-sm text-muted-foreground">No organizations.</p>}
                  <ul className="space-y-2 text-sm">
                    {organizations.map((o) => (
                      <li key={o.id}><strong>{o.name}</strong> — {o.subscription_tier ?? "—"}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {showReports && (
            <TabsContent value="reports" className="space-y-4">
              <ReportsSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
