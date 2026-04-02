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
        $bypassPhi = (bool) ($request->validated('bypass_phi') ?? false);
        $user = Auth::user();

        if ($bypassPhi && ! $this->isBypassAllowed()) {
            return response()->json(['message' => 'Emergency bypass is not allowed.'], 403);
        }

        if ($bypassPhi) {
            $spans = [];
            $redactedPrompt = $prompt;
        } else {
            $spans = $this->detection->detect($prompt);
            $redactedPrompt = $this->redact($prompt, $spans);
        }

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
            'event_type' => $bypassPhi ? 'chat_bypass' : 'chat',
            'detected_categories' => $bypassPhi ? null : array_keys(array_count_values(array_column($spans, 'category'))),
        ]);

        return response()->json([
            'response' => $response,
            'spans' => $spans,
            'rag_context' => $ragResults,
            'redacted_prompt' => $redactedPrompt,
        ]);
    }

    /** Whether the current user is allowed to use emergency bypass (no PHI redaction). */
    private function isBypassAllowed(): bool
    {
        if (config('clinguard.allow_emergency_bypass')) {
            return true;
        }
        $user = Auth::user();
        $user?->load('role');
        if ($user && $user->role) {
            $permissions = $user->role->permissions ?? [];
            if (is_array($permissions) && in_array('emergency_bypass', $permissions, true)) {
                return true;
            }
        }
        return false;
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
