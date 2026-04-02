<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Services\DetectionService;
use App\Services\OpenAIService;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DetectionAndChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, OrganizationSeeder::class]);
    }

    private function createUserWithRole(string $roleName = 'clinician'): User
    {
        $roleId = DB::table('roles')->where('role_name', $roleName)->value('id');
        $orgId = DB::table('organizations')->value('id');
        return User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);
    }

    public function test_detect_returns_spans_when_engine_returns_phi(): void
    {
        $user = $this->createUserWithRole();
        $this->mock(DetectionService::class, function ($mock) {
            $mock->shouldReceive('detect')
                ->once()
                ->with('Patient John Doe SSN 123-45-6789.')
                ->andReturn([
                    ['start' => 8, 'end' => 16, 'category' => 'NAME', 'text' => 'John Doe'],
                    ['start' => 21, 'end' => 32, 'category' => 'SSN', 'text' => '123-45-6789'],
                ]);
        });

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/detect', ['text' => 'Patient John Doe SSN 123-45-6789.']);

        $response->assertOk();
        $response->assertJsonPath('spans.0.category', 'NAME');
        $response->assertJsonPath('spans.1.category', 'SSN');
    }

    public function test_detect_requires_authentication(): void
    {
        $response = $this->postJson('/api/detect', ['text' => 'Some text']);
        $response->assertUnauthorized();
    }

    public function test_chat_returns_response_with_spans_and_redacted_prompt(): void
    {
        $user = $this->createUserWithRole();
        $spans = [
            ['start' => 8, 'end' => 16, 'category' => 'NAME', 'text' => 'John Doe'],
            ['start' => 21, 'end' => 32, 'category' => 'SSN', 'text' => '123-45-6789'],
        ];
        $this->mock(DetectionService::class, function ($mock) use ($spans) {
            $mock->shouldReceive('detect')->once()->andReturn($spans);
            $mock->shouldReceive('ragQuery')->once()->andReturn([['content' => 'Relevant guideline.']]);
        });
        $this->mock(OpenAIService::class, function ($mock) {
            $mock->shouldReceive('chat')->once()->andReturn('AI response summary.');
        });

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/chat', ['prompt' => 'Patient John Doe SSN 123-45-6789.']);

        $response->assertOk();
        $response->assertJsonStructure(['response', 'spans', 'rag_context', 'redacted_prompt']);
        $response->assertJsonPath('spans.0.category', 'NAME');
        $this->assertStringContainsString('[REDACTED-', $response->json('redacted_prompt'));
        $response->assertJsonPath('response', 'AI response summary.');
    }

    public function test_chat_requires_authentication(): void
    {
        $response = $this->postJson('/api/chat', ['prompt' => 'Hello']);
        $response->assertUnauthorized();
    }

    public function test_chat_with_bypass_skips_detection_when_allowed(): void
    {
        $this->app['config']->set('clinguard.allow_emergency_bypass', true);
        $user = $this->createUserWithRole();
        $this->mock(DetectionService::class, function ($mock) {
            $mock->shouldNotReceive('detect');
            $mock->shouldReceive('ragQuery')->once()->andReturn([]);
        });
        $this->mock(OpenAIService::class, function ($mock) {
            $mock->shouldReceive('chat')->once()->andReturn('Bypass response.');
        });

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/chat', ['prompt' => 'Patient John Doe SSN 123-45-6789.', 'bypass_phi' => true]);

        $response->assertOk();
        $response->assertJsonPath('redacted_prompt', 'Patient John Doe SSN 123-45-6789.');
        $response->assertJsonPath('spans', []);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'chat_bypass']);
    }

    public function test_chat_with_bypass_returns_403_when_not_allowed(): void
    {
        $this->app['config']->set('clinguard.allow_emergency_bypass', false);
        $user = $this->createUserWithRole();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/chat', ['prompt' => 'Hello', 'bypass_phi' => true]);

        $response->assertForbidden();
        $response->assertJsonPath('message', 'Emergency bypass is not allowed.');
    }
}
