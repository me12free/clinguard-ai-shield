<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ClinGuard Analytics Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10pt; color: #111; }
        h1 { font-size: 16pt; margin-bottom: 4px; }
        h2 { font-size: 12pt; margin-top: 14px; border-bottom: 1px solid #333; }
        .meta { font-size: 9pt; color: #444; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; }
        .num { text-align: right; }
        .small { font-size: 8pt; color: #555; }
    </style>
</head>
<body>
    <h1>ClinGuard Analytics Report</h1>
    <div class="meta">
        Generated: {{ $report['generated_at'] ?? '' }}<br>
        Scope: {{ $report['scope_label'] ?? ($report['scope'] ?? '') }}<br>
        @if(!empty($report['user']))
            Prepared for: {{ $report['user']['name'] ?? '' }} ({{ $report['user']['role'] ?? '' }})
        @endif
    </div>

    <h2>Key indicators</h2>
    <table>
        @foreach(($report['kpis'] ?? []) as $key => $value)
            <tr>
                <td>{{ str_replace('_', ' ', $key) }}</td>
                <td class="num">
                    @if(is_array($value))
                        {{ json_encode($value) }}
                    @else
                        {{ $value ?? 'n/a' }}
                    @endif
                </td>
            </tr>
        @endforeach
    </table>

    @if(!empty($report['series']['audit_by_event_type']))
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

    @if(!empty($report['breakdowns']['phi_categories_in_audits']))
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

    @if(!empty($report['tables']['organizations_summary']))
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

    @if(!empty($report['tables']['users_by_role']))
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

    @if(!empty($report['composed_daily']))
        <h2>Daily activity (last 30 days)</h2>
        <p class="small">Conversations and audit events per calendar day.</p>
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

    @if(!empty($report['tables']['recent_conversations']))
        <h2>Recent conversations</h2>
        <table>
            <tr><th>When</th><th>Prompt preview</th></tr>
            @foreach(array_slice($report['tables']['recent_conversations'], 0, 10) as $c)
                <tr>
                    <td>{{ $c['created_at'] ?? '' }}</td>
                    <td>{{ $c['prompt_preview'] ?? '' }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(!empty($report['tables']['recent_audit_events']))
        <h2>Recent audit events</h2>
        <table>
            <tr><th>When</th><th>Type</th><th>User ID</th></tr>
        @foreach(array_slice($report['tables']['recent_audit_events'], 0, 15) as $e)
            <tr>
                <td>{{ $e['created_at'] ?? '' }}</td>
                <td>{{ $e['event_type'] ?? '' }}</td>
                <td class="num">{{ $e['user_id'] ?? 'n/a' }}</td>
            </tr>
        @endforeach
        </table>
    @endif

    <p class="small" style="margin-top: 20px;">ClinGuard: governed clinical AI. This report reflects database state at generation time.</p>
</body>
</html>
