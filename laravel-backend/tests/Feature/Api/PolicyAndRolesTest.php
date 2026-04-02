<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\PolicySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PolicyAndRolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, OrganizationSeeder::class, PolicySeeder::class]);
    }

    private function createUserWithRole(string $roleName): User
    {
        $roleId = DB::table('roles')->where('role_name', $roleName)->value('id');
        $orgId = DB::table('organizations')->value('id');
        return User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);
    }

    public function test_policies_index_returns_200_for_user_with_policies_permission(): void
    {
        $user = $this->createUserWithRole('security_admin');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/policies');
        $response->assertOk();
        $response->assertJsonStructure(['data']);
    }

    public function test_policies_index_returns_403_for_clinician(): void
    {
        $user = $this->createUserWithRole('clinician');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/policies');
        $response->assertForbidden();
    }

    public function test_conversations_index_returns_200_for_clinician(): void
    {
        $user = $this->createUserWithRole('clinician');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/conversations');
        $response->assertOk();
        $response->assertJsonStructure(['data']);
    }

    public function test_audit_events_returns_403_for_clinician(): void
    {
        $user = $this->createUserWithRole('clinician');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/audit-events');
        $response->assertForbidden();
    }

    public function test_audit_events_returns_200_for_security_admin(): void
    {
        $user = $this->createUserWithRole('security_admin');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/audit-events');
        $response->assertOk();
    }

    public function test_users_index_returns_403_for_security_admin(): void
    {
        $user = $this->createUserWithRole('security_admin');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/users');
        $response->assertForbidden();
    }

    public function test_users_index_returns_200_for_system_admin(): void
    {
        $user = $this->createUserWithRole('system_admin');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/users');
        $response->assertOk();
        $response->assertJsonStructure(['data']);
    }

    public function test_organizations_index_returns_403_for_clinician(): void
    {
        $user = $this->createUserWithRole('clinician');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/organizations');
        $response->assertForbidden();
    }

    public function test_organizations_index_returns_200_for_system_admin(): void
    {
        $user = $this->createUserWithRole('system_admin');
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/organizations');
        $response->assertOk();
        $response->assertJsonStructure(['data']);
    }

    public function test_policy_update_returns_200_for_security_admin(): void
    {
        $user = $this->createUserWithRole('security_admin');
        $policy = \App\Models\Policy::where('organization_id', $user->organization_id)->first();
        $this->assertNotNull($policy, 'PolicySeeder should create a policy for the default org');
        $response = $this->actingAs($user, 'sanctum')->putJson("/api/policies/{$policy->id}", [
            'policy_name' => 'Updated PHI Policy',
            'enforcement_action' => 'redact',
        ]);
        $response->assertOk();
        $response->assertJsonPath('policy_name', 'Updated PHI Policy');
        $this->assertDatabaseHas('audit_events', ['event_type' => 'policy_update']);
    }
}
