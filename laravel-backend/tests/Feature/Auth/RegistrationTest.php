<?php

namespace Tests\Feature\Auth;

use Database\Seeders\OrganizationSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(OrganizationSeeder::class);

        $response = $this->postJson('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertCreated();
        $response->assertJsonPath('user.email', 'test@example.com');
        $response->assertJsonPath('user.role.role_name', 'clinician');
        $perms = $response->json('user.role.permissions');
        $this->assertIsArray($perms);
        $this->assertContains('chat', $perms);
        $this->assertContains('detect', $perms);
    }
}
