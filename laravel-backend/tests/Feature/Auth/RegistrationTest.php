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
        $this->seed([RoleSeeder::class, OrganizationSeeder::class]);

        $response = $this->postJson('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertCreated();
        $response->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    }
}
