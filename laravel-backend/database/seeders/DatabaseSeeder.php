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
            PolicySeeder::class,
        ]);

        $orgId = DB::table('organizations')->value('id');
        $clinicianId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $securityAdminId = DB::table('roles')->where('role_name', 'security_admin')->value('id');
        $systemAdminId = DB::table('roles')->where('role_name', 'system_admin')->value('id');

        User::query()->updateOrCreate(
            ['email' => 'clinician@test.com'],
            ['name' => 'Clinician User', 'password' => Hash::make('password'), 'role_id' => $clinicianId, 'organization_id' => $orgId]
        );
        User::query()->updateOrCreate(
            ['email' => 'security@test.com'],
            ['name' => 'Security Admin', 'password' => Hash::make('password'), 'role_id' => $securityAdminId, 'organization_id' => $orgId]
        );
        User::query()->updateOrCreate(
            ['email' => 'admin@test.com'],
            ['name' => 'System Admin', 'password' => Hash::make('password'), 'role_id' => $systemAdminId, 'organization_id' => $orgId]
        );
    }
}
