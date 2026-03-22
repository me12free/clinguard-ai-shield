<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use App\Models\AuditEvent;
use App\Models\Conversation;
use App\Services\DetectionService;
use App\Services\OpenAIService;
use App\Support\RoleAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
        $user = Auth::user()->load('role');
        if (! RoleAccess::hasPermission($user, 'chat')) {
            return response()->json(['message' => 'Forbidden: chat permission required.'], 403);
        }

        $detected = $this->detection->detect($prompt);
        $spans = $detected['spans'];
        $redactedPrompt = $this->redact($prompt, $spans);

        $ragResults = $this->detection->ragQuery($redactedPrompt, 5);
        $response = $this->openai->chat($redactedPrompt, $ragResults);

        $conversationId = null;
        try {
            $conv = Conversation::create([
                'user_id' => $user->id,
                'prompt_redacted' => $redactedPrompt,
                'response_summary' => substr($response, 0, 500),
            ]);
            $conversationId = $conv->id;
            Log::channel('clinguard')->info('chat.conversation_saved', [
                'user_id' => $user->id,
                'conversation_id' => $conversationId,
                'span_count' => count($spans),
            ]);
        } catch (\Throwable $e) {
            Log::channel('clinguard')->error('chat.conversation_save_failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        Log::channel('clinguard')->info('chat.completed', [
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'span_count' => count($spans),
            'openai_configured' => filled(config('clinguard.openai_api_key')),
            'engine_error' => $detected['engine_error'] ?? null,
            'conversation_id' => $conversationId,
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
            'engine_error' => $detected['engine_error'] ?? null,
            'openai_configured' => filled(config('clinguard.openai_api_key')),
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
