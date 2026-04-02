<?php

namespace App\Services;

use App\Models\AuditEvent;
use App\Models\Conversation;
use App\Models\Organization;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportAggregatorService
{
    private const SERIES_DAYS = 30;

    /**
     * Build a detailed, role-scoped analytics payload for dashboards and PDF export.
     *
     * Scope priority: global (organizations permission) > organization (audit) > personal (view_own_conversations).
     */
    public function build(User $user): array
    {
        $user->loadMissing('role', 'organization');

        $canGlobal = $user->hasPermission('organizations');
        $canOrg = $user->hasPermission('audit');
        $canPersonal = $user->hasPermission('view_own_conversations');

        if (! $canGlobal && ! $canOrg && ! $canPersonal) {
            abort(403, 'No reporting permissions.');
        }

        if ($canGlobal) {
            return $this->buildGlobal($user);
        }

        if ($canOrg && $user->organization_id) {
            return $this->buildOrganization($user);
        }

        if ($canPersonal) {
            return $this->buildPersonal($user);
        }

        abort(403, 'Reporting requires view_own_conversations, audit, or organizations permission.');
    }

    private function dateRange(): array
    {
        $end = Carbon::now()->endOfDay();
        $start = Carbon::now()->subDays(self::SERIES_DAYS - 1)->startOfDay();

        return [$start, $end];
    }

    /**
     * @return array<int, array{date: string, count: int}>
     */
    private function fillDailySeries(Collection $raw, Carbon $start, Carbon $end, string $countKey = 'count'): array
    {
        $map = [];
        foreach ($raw as $row) {
            $d = is_object($row) ? $row->d : $row['d'];
            $c = is_object($row) ? $row->{$countKey} : $row[$countKey];
            $map[(string) $d] = (int) $c;
        }

        $out = [];
        $cursor = $start->copy();
        while ($cursor <= $end) {
            $key = $cursor->format('Y-m-d');
            $out[] = ['date' => $key, 'count' => $map[$key] ?? 0];
            $cursor->addDay();
        }

        return $out;
    }

    private function buildPersonal(User $user): array
    {
        [$start, $end] = $this->dateRange();

        $convRaw = Conversation::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $convByDay = $this->fillDailySeries($convRaw, $start, $end, 'c');

        $totalConv = Conversation::query()->where('user_id', $user->id)->count();
        $last7 = Conversation::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->count();

        $lastConv = Conversation::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        return [
            'generated_at' => Carbon::now()->toIso8601String(),
            'scope' => 'personal',
            'scope_label' => 'Personal activity (your conversations only)',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->role_name,
            ],
            'organization' => $user->organization ? [
                'id' => $user->organization->id,
                'name' => $user->organization->name,
            ] : null,
            'capabilities' => [
                'personal_reports' => true,
                'organization_reports' => false,
                'global_reports' => false,
            ],
            'kpis' => [
                'conversations_total' => $totalConv,
                'conversations_last_7_days' => $last7,
                'conversations_in_series_window' => array_sum(array_column($convByDay, 'count')),
                'last_conversation_at' => $lastConv?->created_at?->toIso8601String(),
            ],
            'series' => [
                'conversations_by_day' => $convByDay,
            ],
            'composed_daily' => array_map(fn (array $row) => [
                'date' => $row['date'],
                'conversations' => $row['count'],
                'audit_events' => 0,
            ], $convByDay),
            'tables' => [
                'recent_conversations' => Conversation::query()
                    ->where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(15)
                    ->get(['id', 'created_at', 'prompt_redacted', 'response_summary'])
                    ->map(fn (Conversation $c) => [
                        'id' => $c->id,
                        'created_at' => $c->created_at->toIso8601String(),
                        'prompt_preview' => $c->prompt_redacted !== null
                            ? mb_substr((string) $c->prompt_redacted, 0, 120).(mb_strlen((string) $c->prompt_redacted) > 120 ? '...' : '')
                            : null,
                        'summary_preview' => $c->response_summary !== null
                            ? mb_substr((string) $c->response_summary, 0, 80).(mb_strlen((string) $c->response_summary) > 80 ? '...' : '')
                            : null,
                    ]),
            ],
            'breakdowns' => [
                'phi_categories_in_audits' => [],
            ],
        ];
    }

    private function buildOrganization(User $user): array
    {
        $orgId = (int) $user->organization_id;
        [$start, $end] = $this->dateRange();

        $org = Organization::query()->find($orgId);

        $convRaw = Conversation::query()
            ->whereHas('user', fn ($q) => $q->where('organization_id', $orgId))
            ->whereBetween('conversations.created_at', [$start, $end])
            ->selectRaw('DATE(conversations.created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $auditRaw = AuditEvent::query()
            ->where('organization_id', $orgId)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $convByDay = $this->fillDailySeries($convRaw, $start, $end, 'c');
        $auditByDay = $this->fillDailySeries($auditRaw, $start, $end, 'c');

        $byDate = [];
        foreach ($convByDay as $i => $row) {
            $byDate[$row['date']] = [
                'date' => $row['date'],
                'conversations' => $row['count'],
                'audit_events' => 0,
            ];
        }
        foreach ($auditByDay as $row) {
            if (! isset($byDate[$row['date']])) {
                $byDate[$row['date']] = ['date' => $row['date'], 'conversations' => 0, 'audit_events' => 0];
            }
            $byDate[$row['date']]['audit_events'] = $row['count'];
        }
        ksort($byDate);
        $composedDaily = array_values($byDate);

        $eventTypes = AuditEvent::query()
            ->where('organization_id', $orgId)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('event_type, COUNT(*) as c')
            ->groupBy('event_type')
            ->orderByDesc('c')
            ->get()
            ->map(fn ($r) => ['event_type' => $r->event_type, 'count' => (int) $r->c])
            ->values()
            ->all();

        $phiBreakdown = $this->phiCategoryBreakdown(
            AuditEvent::query()
                ->where('organization_id', $orgId)
                ->whereBetween('created_at', [$start, $end])
                ->whereNotNull('detected_categories')
                ->get(['detected_categories'])
        );

        $usersByRole = User::query()
            ->where('organization_id', $orgId)
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->selectRaw('roles.role_name, COUNT(*) as c')
            ->groupBy('roles.role_name')
            ->get()
            ->map(fn ($r) => ['role_name' => $r->role_name, 'count' => (int) $r->c])
            ->values()
            ->all();

        $policyCount = DB::table('policies')->where('organization_id', $orgId)->count();

        return [
            'generated_at' => Carbon::now()->toIso8601String(),
            'scope' => 'organization',
            'scope_label' => 'Organization-wide (your tenant)',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role?->role_name,
            ],
            'organization' => $org ? [
                'id' => $org->id,
                'name' => $org->name,
                'subscription_tier' => $org->subscription_tier,
            ] : ['id' => $orgId],
            'capabilities' => [
                'personal_reports' => $user->hasPermission('view_own_conversations'),
                'organization_reports' => true,
                'global_reports' => false,
            ],
            'kpis' => [
                'users_in_organization' => User::query()->where('organization_id', $orgId)->count(),
                'policies_count' => (int) $policyCount,
                'conversations_total' => Conversation::query()
                    ->whereHas('user', fn ($q) => $q->where('organization_id', $orgId))
                    ->count(),
                'conversations_last_7_days' => Conversation::query()
                    ->whereHas('user', fn ($q) => $q->where('organization_id', $orgId))
                    ->where('conversations.created_at', '>=', Carbon::now()->subDays(7))
                    ->count(),
                'audit_events_total' => AuditEvent::query()->where('organization_id', $orgId)->count(),
                'audit_events_last_7_days' => AuditEvent::query()
                    ->where('organization_id', $orgId)
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->count(),
                'audit_events_in_series_window' => array_sum(array_column($composedDaily, 'audit_events')),
            ],
            'series' => [
                'conversations_by_day' => $convByDay,
                'audit_by_day' => $auditByDay,
                'audit_by_event_type' => $eventTypes,
            ],
            'composed_daily' => $composedDaily,
            'tables' => [
                'recent_audit_events' => AuditEvent::query()
                    ->where('organization_id', $orgId)
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get(['id', 'created_at', 'event_type', 'user_id', 'detected_categories'])
                    ->map(fn (AuditEvent $e) => [
                        'id' => $e->id,
                        'created_at' => $e->created_at->toIso8601String(),
                        'event_type' => $e->event_type,
                        'user_id' => $e->user_id,
                        'detected_categories' => $e->detected_categories,
                    ]),
                'users_by_role' => $usersByRole,
            ],
            'breakdowns' => [
                'phi_categories_in_audits' => $phiBreakdown,
            ],
        ];
    }

    private function buildGlobal(User $user): array
    {
        [$start, $end] = $this->dateRange();

        $convRaw = Conversation::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $auditRaw = AuditEvent::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $convByDay = $this->fillDailySeries($convRaw, $start, $end, 'c');
        $auditByDay = $this->fillDailySeries($auditRaw, $start, $end, 'c');

        $byDate = [];
        foreach ($convByDay as $row) {
            $byDate[$row['date']] = [
                'date' => $row['date'],
                'conversations' => $row['count'],
                'audit_events' => 0,
            ];
        }
        foreach ($auditByDay as $row) {
            if (! isset($byDate[$row['date']])) {
                $byDate[$row['date']] = [
                    'date' => $row['date'],
                    'conversations' => 0,
                    'audit_events' => 0,
                ];
            }
            $byDate[$row['date']]['audit_events'] = $row['count'];
        }
        ksort($byDate);
        $composedDaily = array_values($byDate);

        $eventTypes = AuditEvent::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('event_type, COUNT(*) as c')
            ->groupBy('event_type')
            ->orderByDesc('c')
            ->get()
            ->map(fn ($r) => ['event_type' => $r->event_type, 'count' => (int) $r->c])
            ->values()
            ->all();

        $phiBreakdown = $this->phiCategoryBreakdown(
            AuditEvent::query()
                ->whereBetween('created_at', [$start, $end])
                ->whereNotNull('detected_categories')
                ->get(['detected_categories'])
        );

        $orgSummaries = Organization::query()
            ->orderBy('name')
            ->get()
            ->map(function (Organization $o) {
                $uid = $o->id;

                return [
                    'id' => $o->id,
                    'name' => $o->name,
                    'subscription_tier' => $o->subscription_tier,
                    'users_count' => User::query()->where('organization_id', $uid)->count(),
                    'conversations_count' => Conversation::query()
                        ->whereHas('user', fn ($q) => $q->where('organization_id', $uid))
                        ->count(),
                    'audit_events_count' => AuditEvent::query()->where('organization_id', $uid)->count(),
                    'policies_count' => (int) DB::table('policies')->where('organization_id', $uid)->count(),
                ];
            })
            ->values()
            ->all();

        return [
            'generated_at' => Carbon::now()->toIso8601String(),
            'scope' => 'global',
            'scope_label' => 'All organisations (system administrator view)',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role?->role_name,
            ],
            'organization' => null,
            'capabilities' => [
                'personal_reports' => $user->hasPermission('view_own_conversations'),
                'organization_reports' => true,
                'global_reports' => true,
            ],
            'kpis' => [
                'organizations_count' => Organization::query()->count(),
                'users_total' => User::query()->count(),
                'conversations_total' => Conversation::query()->count(),
                'conversations_last_7_days' => Conversation::query()
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->count(),
                'audit_events_total' => AuditEvent::query()->count(),
                'audit_events_last_7_days' => AuditEvent::query()
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->count(),
                'policies_total' => (int) DB::table('policies')->count(),
            ],
            'series' => [
                'conversations_by_day' => $convByDay,
                'audit_by_day' => $auditByDay,
                'audit_by_event_type' => $eventTypes,
            ],
            'composed_daily' => $composedDaily,
            'tables' => [
                'organizations_summary' => $orgSummaries,
                'recent_audit_events' => AuditEvent::query()
                    ->orderByDesc('created_at')
                    ->limit(25)
                    ->get(['id', 'created_at', 'event_type', 'user_id', 'organization_id', 'detected_categories'])
                    ->map(fn (AuditEvent $e) => [
                        'id' => $e->id,
                        'created_at' => $e->created_at->toIso8601String(),
                        'event_type' => $e->event_type,
                        'user_id' => $e->user_id,
                        'organization_id' => $e->organization_id,
                        'detected_categories' => $e->detected_categories,
                    ]),
            ],
            'breakdowns' => [
                'phi_categories_in_audits' => $phiBreakdown,
            ],
        ];
    }

    /**
     * @param  Collection<int, AuditEvent>  $events
     * @return list<array{category: string, count: int}>
     */
    private function phiCategoryBreakdown(Collection $events): array
    {
        $counts = [];
        foreach ($events as $event) {
            $cats = $event->detected_categories;
            if (! is_array($cats)) {
                continue;
            }
            foreach ($cats as $cat) {
                if (! is_string($cat) || $cat === '') {
                    continue;
                }
                $counts[$cat] = ($counts[$cat] ?? 0) + 1;
            }
        }
        arsort($counts);

        return collect($counts)->map(fn (int $c, string $k) => ['category' => $k, 'count' => $c])->values()->all();
    }
}
