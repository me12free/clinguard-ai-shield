<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end API auth: login + Sanctum token + /api/user for each seeded role.
 */
class RoleBasedAuthE2ETest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_clinician_can_login_and_receive_token_and_role(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'sarah.chen@clinguard.local',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.name', 'Dr. Sarah Chen');
        $response->assertJsonPath('user.role.role_name', 'clinician');
        $response->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'name',
                'email',
                'organization_id',
                'role' => ['role_name', 'permissions'],
            ],
        ]);
        $this->assertContains('chat', $response->json('user.role.permissions'));
    }

    public function test_security_admin_can_login_and_api_user_matches(): void
    {
        $token = $this->loginToken('marcus.webb@clinguard.local');

        $me = $this->getJson('/api/user', [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ]);

        $me->assertOk();
        $me->assertJsonPath('name', 'Marcus Webb');
        $me->assertJsonPath('role.role_name', 'security_admin');
        $this->assertContains('audit', $me->json('role.permissions'));
    }

    public function test_system_admin_can_login_and_api_user_matches(): void
    {
        $token = $this->loginToken('priya.nair@clinguard.local');

        $me = $this->getJson('/api/user', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $me->assertOk();
        $me->assertJsonPath('name', 'Priya Nair');
        $me->assertJsonPath('role.role_name', 'system_admin');
        $this->assertContains('manage_organizations', $me->json('role.permissions'));
    }

    public function test_invalid_credentials_return_422(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'sarah.chen@clinguard.local',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Stale Laravel web session + empty SPA localStorage used to trigger guest→302→GET /
     * (JSON without token) and "No token received" in the browser.
     */
    public function test_clinician_cannot_access_audit_events_api(): void
    {
        $token = $this->loginToken('sarah.chen@clinguard.local');
        $this->getJson('/api/audit-events', [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ])->assertStatus(403);
    }

    public function test_security_admin_can_list_audit_events(): void
    {
        $token = $this->loginToken('marcus.webb@clinguard.local');
        $res = $this->getJson('/api/audit-events', [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ]);
        $res->assertOk();
        $res->assertJsonStructure(['data']);
    }

    public function test_json_login_returns_token_when_web_session_already_exists(): void
    {
        $user = \App\Models\User::query()->where('email', 'marcus.webb@clinguard.local')->firstOrFail();
        $this->actingAs($user);

        $response = $this->postJson('/login', [
            'email' => 'marcus.webb@clinguard.local',
            'password' => 'password',
        ]);

        $response->assertOk();
        $this->assertNotEmpty($response->json('token'));
        $response->assertJsonPath('user.role.role_name', 'security_admin');
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
