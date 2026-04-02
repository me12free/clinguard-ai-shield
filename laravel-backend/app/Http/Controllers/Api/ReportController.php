<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportAggregatorService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function __construct(
        private ReportAggregatorService $aggregator
    ) {}

    /**
     * JSON payload for dashboard charts and tables (role-scoped).
     */
    public function summary(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'organization_id' => ['nullable', 'integer', 'min:1'],
            'event_types' => ['nullable', 'array'],
            'event_types.*' => ['string', 'max:120'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'phi_categories' => ['nullable', 'array'],
            'phi_categories.*' => ['string', 'max:120'],
            'scope' => ['nullable', 'in:personal,organization,global'],
        ]);

        $data = $this->aggregator->build($user, $validated);

        return response()->json($data);
    }

    /**
     * PDF export with the same scope and figures as the JSON summary.
     */
    public function exportPdf(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'organization_id' => ['nullable', 'integer', 'min:1'],
            'event_types' => ['nullable', 'array'],
            'event_types.*' => ['string', 'max:120'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'phi_categories' => ['nullable', 'array'],
            'phi_categories.*' => ['string', 'max:120'],
            'scope' => ['nullable', 'in:personal,organization,global'],
            'include_sections' => ['nullable', 'array'],
            'include_sections.*' => ['string', 'in:kpis,series,breakdowns,tables,composed_daily'],
        ]);

        $data = $this->aggregator->build($user, $validated);
        $includeSections = $validated['include_sections'] ?? ['kpis', 'series', 'breakdowns', 'tables', 'composed_daily'];

        if (! app()->bound('dompdf.wrapper')) {
            return response()->json([
                'message' => 'PDF export is not available. Install barryvdh/laravel-dompdf in laravel-backend, then restart Laravel.',
            ], 503);
        }

        $pdf = app('dompdf.wrapper')->loadView('reports.summary-pdf', [
            'report' => $data,
            'include_sections' => $includeSections,
        ])
            ->setPaper('a4', 'portrait');

        $filename = 'clinguard-report-'.now()->format('Y-m-d-His').'.pdf';

        return $pdf->download($filename);
    }
}
