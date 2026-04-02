<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, OrganizationSeeder::class]);
    }

    public function test_get_user_returns_authenticated_user_with_role_and_permissions(): void
    {
        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');
        $user = User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/user');

        $response->assertOk();
        $response->assertJsonStructure([
            'id', 'name', 'email',
            'role' => ['id', 'role_name', 'permissions'],
        ]);
        $response->assertJsonPath('id', $user->id);
        $response->assertJsonPath('role.role_name', 'clinician');
        $this->assertIsArray($response->json('role.permissions'));
    }

    public function test_get_user_requires_authentication(): void
    {
        $response = $this->getJson('/api/user');
        $response->assertUnauthorized();
    }
}
