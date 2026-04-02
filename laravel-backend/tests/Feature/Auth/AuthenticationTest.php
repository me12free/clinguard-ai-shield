<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, OrganizationSeeder::class]);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');
        $user = User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertOk();
        $response->assertJsonStructure(['token', 'user']);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');
        $user = User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);

        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');
        $user = User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/logout');

        $response->assertOk();
        $response->assertJson(['message' => 'Logged out']);
    }
}
