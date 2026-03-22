<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * PHI pipeline: Laravel proxies to Python detection engine (HTTP mocked here).
 * Login must run before Http::fake() — faking can interfere with auth/session HTTP.
 */
class PhiEngineDetectionE2ETest extends TestCase
{
    use RefreshDatabase;

    private string $engineBase = 'http://detection-engine.test';

    protected function setUp(): void
    {
        parent::setUp();
        config(['clinguard.detection_engine_url' => $this->engineBase]);
        $this->seed(DatabaseSeeder::class);
    }

    protected function tearDown(): void
    {
        Http::fake();
        parent::tearDown();
    }

    public function test_detect_returns_spans_from_engine_and_posts_to_configured_url(): void
    {
        $token = $this->loginToken('sarah.chen@clinguard.local');

        $fakeSpans = [
            ['start' => 10, 'end' => 21, 'category' => 'SSN', 'text' => '123-45-6789'],
        ];

        Http::fake([
            $this->engineBase.'/detect' => Http::response(['spans' => $fakeSpans], 200),
        ]);

        $response = $this->postJson('/api/detect', [
            'text' => 'Patient SSN 123-45-6789 on file.',
        ], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('spans.0.category', 'SSN');
        $response->assertJsonPath('engine_error', null);

        $base = $this->engineBase;
        Http::assertSent(function ($request) use ($base) {
            return $request->url() === $base.'/detect'
                && $request['text'] === 'Patient SSN 123-45-6789 on file.';
        });
    }

    public function test_detect_works_for_security_admin(): void
    {
        $token = $this->loginToken('marcus.webb@clinguard.local');

        Http::fake([
            $this->engineBase.'/detect' => Http::response(['spans' => []], 200),
        ]);

        $this->postJson('/api/detect', ['text' => 'ok'], [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();
    }

    public function test_detect_works_for_system_admin(): void
    {
        $token = $this->loginToken('priya.nair@clinguard.local');

        Http::fake([
            $this->engineBase.'/detect' => Http::response(['spans' => []], 200),
        ]);

        $this->postJson('/api/detect', ['text' => 'ok'], [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();
    }

    public function test_detect_returns_empty_when_engine_errors(): void
    {
        $token = $this->loginToken('sarah.chen@clinguard.local');

        Http::fake([
            $this->engineBase.'/detect' => Http::response('bad gateway', 502),
        ]);

        $response = $this->postJson('/api/detect', [
            'text' => 'Hello',
        ], [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('spans', []);
        $this->assertNotNull($response->json('engine_error'));
    }

    public function test_detect_requires_authentication(): void
    {
        $response = $this->postJson('/api/detect', ['text' => 'x']);
        $response->assertUnauthorized();
    }

    private function loginToken(string $email): string
    {
        $response = $this->postJson('/login', [
            'email' => $email,
            'password' => 'password',
        ]);
        $response->assertOk();

        return $response->json('token');
    }
}
