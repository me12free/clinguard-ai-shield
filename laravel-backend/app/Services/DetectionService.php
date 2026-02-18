<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Calls Python detection engine for PHI spans and RAG retrieval. */
class DetectionService
{
    /** POST text to /detect; returns [{ start, end, category }]. */
    public function detect(string $text): array
    {
        $url = config('clinguard.detection_engine_url') . '/detect';

        try {
            $response = Http::timeout(10)->post($url, ['text' => $text]);

            if ($response->successful()) {
                return $response->json('spans', []);
            }

            Log::warning('Detection engine non-200', ['status' => $response->status(), 'body' => $response->body()]);
            return [];
        } catch (\Throwable $e) {
            Log::error('Detection engine error', ['message' => $e->getMessage()]);
            return [];
        }
    }

    /** POST query to /rag; returns [{ content }] for context. */
    public function ragQuery(string $query, int $topK = 5): array
    {
        $url = config('clinguard.detection_engine_url') . '/rag';

        try {
            $response = Http::timeout(15)->post($url, ['query' => $query, 'top_k' => $topK]);

            if ($response->successful()) {
                return $response->json('results', []);
            }

            return [];
        } catch (\Throwable $e) {
            Log::error('RAG engine error', ['message' => $e->getMessage()]);
            return [];
        }
    }
}
