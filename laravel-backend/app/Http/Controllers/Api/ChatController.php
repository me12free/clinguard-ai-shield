<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use App\Models\AuditEvent;
use App\Models\Conversation;
use App\Services\DetectionService;
use App\Services\OpenAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/** Chat endpoint: PHI detection, redaction, RAG, OpenAI, audit. */
class ChatController extends Controller
{
    public function __construct(
        private DetectionService $detection,
        private OpenAIService $openai
    ) {}

    public function __invoke(ChatRequest $request): JsonResponse
    {
        $prompt = $request->validated('prompt');
        $user = Auth::user();

        $spans = $this->detection->detect($prompt);
        $redactedPrompt = $this->redact($prompt, $spans);

        $ragResults = $this->detection->ragQuery($redactedPrompt, 5);
        $response = $this->openai->chat($redactedPrompt, $ragResults);

        Conversation::create([
            'user_id' => $user->id,
            'prompt_redacted' => $redactedPrompt,
            'response_summary' => substr($response, 0, 500),
        ]);

        AuditEvent::create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'chat',
            'detected_categories' => array_keys(array_count_values(array_column($spans, 'category'))),
        ]);

        return response()->json([
            'response' => $response,
            'spans' => $spans,
            'rag_context' => $ragResults,
            'redacted_prompt' => $redactedPrompt,
        ]);
    }

    /** Build redacted text by replacing PHI spans from end to start. */
    private function redact(string $text, array $spans): string
    {
        $sorted = collect($spans)->sortByDesc('start')->values()->all();
        foreach ($sorted as $span) {
            $start = (int) ($span['start'] ?? 0);
            $end = (int) ($span['end'] ?? $start);
            $cat = $span['category'] ?? 'PHI';
            $text = substr($text, 0, $start) . '[REDACTED-' . $cat . ']' . substr($text, $end);
        }
        return $text;
    }
}
