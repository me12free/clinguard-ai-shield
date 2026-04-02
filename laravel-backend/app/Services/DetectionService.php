<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Calls Python detection engine for PHI spans and RAG retrieval. */
class DetectionService
{
    /**
     * POST text to /detect; returns spans + optional engine_error when the engine is down or errors.
     *
     * @return array{spans: array, engine_error: string|null}
     */
    public function detect(string $text): array
    {
        $url = config('clinguard.detection_engine_url') . '/detect';
        $timeout = (int) config('clinguard.detection_engine_timeout', 120);

        try {
            $response = Http::timeout($timeout)->post($url, ['text' => $text]);

            if ($response->successful()) {
                $spans = $response->json('spans', []);
                $host = parse_url((string) config('clinguard.detection_engine_url'), PHP_URL_HOST) ?: 'unknown';
                Log::channel('clinguard')->info('detection.success', [
                    'text_length' => strlen($text),
                    'span_count' => count($spans),
                    'engine_host' => $host,
                ]);

                return [
                    'spans' => $spans,
                    'engine_error' => null,
                ];
            }

            $msg = 'Detection engine returned HTTP '.$response->status();
            Log::warning('Detection engine non-200', ['status' => $response->status(), 'body' => $response->body()]);

            return [
                'spans' => [],
                'engine_error' => $msg,
            ];
        } catch (\Throwable $e) {
            Log::error('Detection engine error', ['message' => $e->getMessage()]);

            return [
                'spans' => [],
                'engine_error' => $e->getMessage(),
            ];
        }
    }

    /** POST query to /rag; returns [{ content }] for context. */
    public function ragQuery(string $query, int $topK = 5): array
    {
        $url = config('clinguard.detection_engine_url') . '/rag';
        $timeout = (int) config('clinguard.detection_engine_timeout', 120);

        try {
            $response = Http::timeout($timeout)->post($url, ['query' => $query, 'top_k' => $topK]);

            if ($response->successful()) {
                $results = $response->json('results', []);
                Log::channel('clinguard')->info('rag.success', [
                    'query_length' => strlen($query),
                    'chunk_count' => count($results),
                ]);

                return $results;
            }

            return [];
        } catch (\Throwable $e) {
            Log::error('RAG engine error', ['message' => $e->getMessage()]);

            return [];
        }
    }
}
