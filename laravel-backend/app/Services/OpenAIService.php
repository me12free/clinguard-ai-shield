<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** OpenAI chat completions with optional RAG context in system message. */
class OpenAIService
{
    public function chat(string $prompt, array $ragContext = []): string
    {
        $key = config('clinguard.openai_api_key');
        if (empty($key)) {
            return 'OpenAI API key is not configured. Set OPENAI_API_KEY in .env for AI responses.';
        }

        $systemContent = 'You are a clinical documentation assistant. Respond concisely and professionally.';
        if (!empty($ragContext)) {
            $contextText = implode("\n", array_map(fn ($r) => $r['content'] ?? $r['text'] ?? '', $ragContext));
            $systemContent .= "\n\nRelevant clinical context:\n" . $contextText;
        }

        try {
            $response = Http::withToken($key)
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('clinguard.openai_model', 'gpt-4o-mini'),
                    'messages' => [
                        ['role' => 'system', 'content' => $systemContent],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 1024,
                ]);

            if ($response->successful()) {
                $body = $response->json();
                return $body['choices'][0]['message']['content'] ?? '';
            }

            Log::warning('OpenAI API error', ['status' => $response->status(), 'body' => $response->body()]);
            return 'Unable to get AI response. Please try again.';
        } catch (\Throwable $e) {
            Log::error('OpenAI error', ['message' => $e->getMessage()]);
            return 'An error occurred while calling the AI service.';
        }
    }
}
