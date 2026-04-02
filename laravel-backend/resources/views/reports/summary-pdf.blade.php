<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ClinGuard Report</title>
    <style>
        @page { margin: 20px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #0f172a;
            margin: 0;
            line-height: 1.35;
        }
        h1 { font-size: 20pt; margin: 0; letter-spacing: 0.2px; }
        h2 {
            font-size: 11pt;
            margin: 16px 0 8px 0;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-left: 3px solid #1d4ed8;
            padding-left: 8px;
        }
        .muted { color: #64748b; font-size: 8.8pt; }
        .header {
            border: 1px solid #dbeafe;
            background: #eff6ff;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 14px;
        }
        .meta-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .meta-grid td {
            border: none;
            padding: 2px 0;
            font-size: 9pt;
        }
        .chip {
            display: inline-block;
            padding: 3px 8px;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            font-size: 8.3pt;
            color: #1e3a8a;
            background: #ffffff;
            margin: 2px 4px 0 0;
        }
        .kpi-table td {
            border: 1px solid #e2e8f0;
            padding: 9px 10px;
        }
        .kpi-label { background: #f8fafc; width: 68%; color: #334155; }
        .kpi-value { text-align: right; font-weight: 700; width: 32%; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
            font-size: 9pt;
        }
        th {
            background: #f8fafc;
            color: #334155;
            font-weight: 700;
            font-size: 8.6pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        tr:nth-child(even) td { background: #fcfdff; }
        .num { text-align: right; }
        .footer-note {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    @php
        $sections = $include_sections ?? ['kpis', 'series', 'breakdowns', 'tables', 'composed_daily'];
        $applied = $report['meta']['applied_filters'] ?? [];
        $generated = $report['meta']['generated_at'] ?? ($report['generated_at'] ?? '');
    @endphp

    <div class="header">
        <h1>ClinGuard Reports</h1>
        <table class="meta-grid">
            <tr>
                <td><strong>Scope:</strong> {{ $report['scope_label'] ?? ($report['scope'] ?? 'n/a') }}</td>
                <td><strong>Generated:</strong> {{ $generated }}</td>
            </tr>
            <tr>
                <td><strong>Prepared for:</strong> {{ $report['user']['name'] ?? 'n/a' }} ({{ $report['user']['role'] ?? 'n/a' }})</td>
                <td><strong>Date range:</strong> {{ $applied['from'] ?? 'n/a' }} to {{ $applied['to'] ?? 'n/a' }}</td>
            </tr>
        </table>
        <div style="margin-top: 8px;">
            <span class="chip">Org: {{ $applied['organization_id'] ?? 'all' }}</span>
            <span class="chip">User: {{ $applied['user_id'] ?? 'all' }}</span>
            <span class="chip">Events: {{ !empty($applied['event_types']) ? implode(', ', $applied['event_types']) : 'all' }}</span>
            <span class="chip">PHI: {{ !empty($applied['phi_categories']) ? implode(', ', $applied['phi_categories']) : 'all' }}</span>
        </div>
    </div>

    @if(in_array('kpis', $sections, true))
        <h2>Key indicators</h2>
        <table class="kpi-table">
            @foreach(($report['kpis'] ?? []) as $key => $value)
                <tr>
                    <td class="kpi-label">{{ ucwords(str_replace('_', ' ', $key)) }}</td>
                    <td class="kpi-value">
                        @if(is_array($value))
                            {{ json_encode($value) }}
                        @else
                            {{ $value ?? 'n/a' }}
                        @endif
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('series', $sections, true) && !empty($report['series']['audit_by_event_type']))
        <h2>Audit events by type ({{ count($report['series']['audit_by_event_type'] ?? []) }} categories in window)</h2>
        <table>
            <tr><th>Event type</th><th class="num">Count</th></tr>
            @foreach($report['series']['audit_by_event_type'] as $row)
                <tr>
                    <td>{{ $row['event_type'] ?? '' }}</td>
                    <td class="num">{{ $row['count'] ?? 0 }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('breakdowns', $sections, true) && !empty($report['breakdowns']['phi_categories_in_audits']))
        <h2>PHI categories recorded on audit events (window)</h2>
        <table>
            <tr><th>Category</th><th class="num">Occurrences</th></tr>
            @foreach($report['breakdowns']['phi_categories_in_audits'] as $row)
                <tr>
                    <td>{{ $row['category'] ?? '' }}</td>
                    <td class="num">{{ $row['count'] ?? 0 }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('tables', $sections, true) && !empty($report['tables']['organizations_summary']))
        <h2>Organisations summary</h2>
        <table>
            <tr>
                <th>Name</th>
                <th class="num">Users</th>
                <th class="num">Conversations</th>
                <th class="num">Audit events</th>
                <th class="num">Policies</th>
            </tr>
            @foreach($report['tables']['organizations_summary'] as $org)
                <tr>
                    <td>{{ $org['name'] ?? '' }}</td>
                    <td class="num">{{ $org['users_count'] ?? 0 }}</td>
                    <td class="num">{{ $org['conversations_count'] ?? 0 }}</td>
                    <td class="num">{{ $org['audit_events_count'] ?? 0 }}</td>
                    <td class="num">{{ $org['policies_count'] ?? 0 }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('tables', $sections, true) && !empty($report['tables']['users_by_role']))
        <h2>Users by role (organisation)</h2>
        <table>
            <tr><th>Role</th><th class="num">Count</th></tr>
            @foreach($report['tables']['users_by_role'] as $row)
                <tr>
                    <td>{{ $row['role_name'] ?? '' }}</td>
                    <td class="num">{{ $row['count'] ?? 0 }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('composed_daily', $sections, true) && !empty($report['composed_daily']))
        <h2>Daily activity</h2>
        <div class="muted">Conversations and audit events per calendar day for the selected range.</div>
        <table>
            <tr><th>Date</th><th class="num">Conversations</th><th class="num">Audit events</th></tr>
            @foreach($report['composed_daily'] as $row)
                <tr>
                    <td>{{ $row['date'] ?? '' }}</td>
                    <td class="num">{{ $row['conversations'] ?? 0 }}</td>
                    <td class="num">{{ $row['audit_events'] ?? 0 }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('tables', $sections, true) && !empty($report['tables']['recent_conversations']))
        <h2>Recent conversations</h2>
        <table>
            <tr><th>When</th><th>Prompt preview</th></tr>
            @foreach(collect($report['tables']['recent_conversations'])->take(10) as $c)
                <tr>
                    <td>{{ $c['created_at'] ?? '' }}</td>
                    <td>{{ $c['prompt_preview'] ?? '' }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(in_array('tables', $sections, true) && !empty($report['tables']['recent_audit_events']))
        <h2>Recent audit events</h2>
        <table>
            <tr><th>When</th><th>Type</th><th>User ID</th></tr>
        @foreach(collect($report['tables']['recent_audit_events'])->take(15) as $e)
            <tr>
                <td>{{ $e['created_at'] ?? '' }}</td>
                <td>{{ $e['event_type'] ?? '' }}</td>
                <td class="num">{{ $e['user_id'] ?? 'n/a' }}</td>
            </tr>
        @endforeach
        </table>
    @endif

    <p class="muted footer-note">ClinGuard governed clinical AI. This report reflects database state at generation time.</p>
</body>
</html>
