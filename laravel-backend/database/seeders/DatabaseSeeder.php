<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            OrganizationSeeder::class,
        ]);

        $roleId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $orgId = DB::table('organizations')->value('id');

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role_id' => $roleId,
                'organization_id' => $orgId,
            ]
        );
    }
}
