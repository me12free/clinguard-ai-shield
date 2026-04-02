<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportAggregatorService;
use Barryvdh\DomPDF\Facade\Pdf;
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

        $data = $this->aggregator->build($user);

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

        $data = $this->aggregator->build($user);

        $pdf = Pdf::loadView('reports.summary-pdf', ['report' => $data])
            ->setPaper('a4', 'portrait');

        $filename = 'clinguard-report-'.now()->format('Y-m-d-His').'.pdf';

        return $pdf->download($filename);
    }
}
