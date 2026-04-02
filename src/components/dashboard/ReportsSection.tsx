import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ReportFilters, type ReportSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatKpiLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReportsSection() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [orgOptions, setOrgOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      event_types: [],
      phi_categories: [],
      include_sections: ["kpis", "series", "breakdowns", "tables", "composed_daily"],
    };
  });
  const [eventTypeText, setEventTypeText] = useState("");
  const [phiCatText, setPhiCatText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [quickSearch, setQuickSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const load = useCallback((f: ReportFilters) => {
    setLoading(true);
    setError("");
    api
      .getReportsSummary(f)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  useEffect(() => {
    if (!data?.meta?.capabilities?.global_reports) {
      setOrgOptions([]);
      return;
    }
    api
      .getOrganizations()
      .then((r) => setOrgOptions((r.data ?? []).map((o) => ({ id: o.id, name: o.name }))))
      .catch(() => setOrgOptions([]));
  }, [data?.meta?.capabilities?.global_reports]);

  const onExportPdf = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await api.downloadReportsPdf(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinguard-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const canGlobal = data?.meta?.capabilities?.global_reports ?? false;
  const canOrg = data?.meta?.capabilities?.organization_reports ?? false;
  const includeSections = useMemo(() => new Set(filters.include_sections ?? []), [filters.include_sections]);
  const quickSuggestionPool = useMemo(() => {
    const sectionLabels = ["kpis", "series", "breakdowns", "tables", "composed_daily"];
    const eventTypes = (data?.series.audit_by_event_type ?? []).map((x) => x.event_type);
    const phiCategories = (data?.breakdowns.phi_categories_in_audits ?? []).map((x) => x.category);
    const orgNames = orgOptions.map((x) => x.name);
    return Array.from(new Set([...sectionLabels, ...eventTypes, ...phiCategories, ...orgNames])).filter(Boolean);
  }, [data, orgOptions]);
  const visibleSuggestions = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return quickSuggestionPool.slice(0, 8);
    return quickSuggestionPool.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [quickSearch, quickSuggestionPool]);

  const setInclude = (section: NonNullable<ReportFilters["include_sections"]>[number], checked: boolean) => {
    const current = new Set(filters.include_sections ?? []);
    if (checked) current.add(section);
    else current.delete(section);
    setFilters((prev) => ({ ...prev, include_sections: Array.from(current) as ReportFilters["include_sections"] }));
  };
  const applyQuickSuggestion = (value: string) => {
    const lower = value.toLowerCase();
    const sectionValues: Array<NonNullable<ReportFilters["include_sections"]>[number]> = [
      "kpis",
      "series",
      "breakdowns",
      "tables",
      "composed_daily",
    ];
    if (sectionValues.includes(lower as NonNullable<ReportFilters["include_sections"]>[number])) {
      setInclude(lower as NonNullable<ReportFilters["include_sections"]>[number], true);
    } else if (orgOptions.some((o) => o.name.toLowerCase() === lower)) {
      const org = orgOptions.find((o) => o.name.toLowerCase() === lower);
      if (org && canGlobal) {
        setFilters((p) => ({ ...p, organization_id: org.id }));
      }
    } else if ((data?.series.audit_by_event_type ?? []).some((e) => e.event_type.toLowerCase() === lower)) {
      setEventTypeText((prev) => {
        const base = prev
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...base, value]));
        setFilters((p) => ({ ...p, event_types: merged }));
        return merged.join(", ");
      });
    } else {
      setPhiCatText((prev) => {
        const base = prev
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...base, value]));
        setFilters((p) => ({ ...p, phi_categories: merged }));
        return merged.join(", ");
      });
    }
    setQuickSearch("");
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Analytics and reports</h2>
          <p className="text-sm text-muted-foreground">
            Scope: {data?.scope_label ?? "Load data to see your access level and metrics."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(filters)} disabled={loading}>
            {loading ? "Loading..." : "Refresh data"}
          </Button>
          <Button onClick={onExportPdf} disabled={exporting || !data}>
            {exporting ? "Exporting..." : "Export PDF report"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && !data && <p className="text-sm text-muted-foreground">Loading report...</p>}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Modern filters</CardTitle>
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1 md:col-span-2 xl:col-span-3 relative">
              <Label className="text-xs">Quick search with autosuggest</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search event type, PHI category, org name, or section..."
                />
              </div>
              {showSuggestions && visibleSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md">
                  {visibleSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyQuickSuggestion(s);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {visibleSuggestions.slice(0, 4).map((s) => (
                  <Badge
                    key={`chip-${s}`}
                    variant="secondary"
                    className="cursor-pointer text-[10px]"
                    onClick={() => applyQuickSuggestion(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
          </div>
          {canGlobal && (
            <div className="space-y-1">
              <Label className="text-xs">Organization ID</Label>
              <Input
                type="number"
                placeholder={orgOptions.length ? `e.g. ${orgOptions[0].id}` : "Optional"}
                value={filters.organization_id ?? ""}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    organization_id: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                  }))
                }
              />
            </div>
          )}
          {(canGlobal || canOrg) && (
            <div className="space-y-1">
              <Label className="text-xs">User ID</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={filters.user_id ?? ""}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    user_id: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                  }))
                }
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Event types (comma-separated)</Label>
            <Input
              value={eventTypeText}
              onChange={(e) => setEventTypeText(e.target.value)}
              onBlur={() =>
                setFilters((p) => ({
                  ...p,
                  event_types: eventTypeText
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="chat, policy_update"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">PHI categories (comma-separated)</Label>
            <Input
              value={phiCatText}
              onChange={(e) => setPhiCatText(e.target.value)}
              onBlur={() =>
                setFilters((p) => ({
                  ...p,
                  phi_categories: phiCatText
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="NAME, DATE"
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label className="text-xs">Export sections</Label>
            <div className="flex flex-wrap gap-4">
              {(["kpis", "series", "breakdowns", "tables", "composed_daily"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={includeSections.has(s)} onCheckedChange={(v) => setInclude(s, v === true)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          </CardContent>
        )}
      </Card>

      {data && (
        <>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(data.generated_at).toLocaleString()}. Date range follows your selected filters.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(data.kpis).map(([k, v]) => (
              <KpiCard key={k} label={formatKpiLabel(k)} value={v === null || v === undefined ? "n/a" : String(v)} />
            ))}
          </div>

          {(data.series.conversations_by_day?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversations per day</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series.conversations_by_day} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Conversations" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(data.scope === "organization" || data.scope === "global") &&
            data.composed_daily?.some((d) => d.audit_events > 0 || d.conversations > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Combined daily activity (bars: conversations, line: audit events)</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.composed_daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={55} />
                      <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="conversations" name="Conversations" fill="#2563eb" radius={[2, 2, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="audit_events"
                        name="Audit events"
                        stroke="hsl(24 95% 53%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

          {data.series.audit_by_event_type && data.series.audit_by_event_type.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit events by type (current window)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series.audit_by_event_type} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="event_type" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {data.breakdowns.phi_categories_in_audits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PHI categories on audit payloads (frequency)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.breakdowns.phi_categories_in_audits} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Occurrences" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {data.tables.organizations_summary && data.tables.organizations_summary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organisations summary</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Conversations</TableHead>
                      <TableHead className="text-right">Audit events</TableHead>
                      <TableHead className="text-right">Policies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.organizations_summary.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.users_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.conversations_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.audit_events_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.policies_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.tables.users_by_role && data.tables.users_by_role.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by role (your organisation)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.users_by_role.map((r) => (
                      <TableRow key={r.role_name}>
                        <TableCell>{r.role_name}</TableCell>
                        <TableCell className="text-right">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.tables.recent_audit_events && data.tables.recent_audit_events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent audit events</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Org</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.recent_audit_events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm">{new Date(e.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{e.event_type}</TableCell>
                        <TableCell className="text-sm">{e.user_id ?? "n/a"}</TableCell>
                        <TableCell className="text-sm">{"organization_id" in e ? String(e.organization_id ?? "n/a") : "n/a"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.tables.recent_conversations && data.tables.recent_conversations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent conversations</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Prompt preview</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tables.recent_conversations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="whitespace-nowrap text-sm">{new Date(c.created_at).toLocaleString()}</TableCell>
                        <TableCell className="max-w-md text-sm text-muted-foreground">{c.prompt_preview ?? "n/a"}</TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">{c.summary_preview ?? "n/a"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
