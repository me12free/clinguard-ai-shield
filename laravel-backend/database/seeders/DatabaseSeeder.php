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
            AllowlistSeeder::class,
            DetectionRuleSeeder::class,
        ]);

        $orgId = DB::table('organizations')->value('id');
        $clinicianId = DB::table('roles')->where('role_name', 'clinician')->value('id');
        $securityAdminId = DB::table('roles')->where('role_name', 'security_admin')->value('id');
        $systemAdminId = DB::table('roles')->where('role_name', 'system_admin')->value('id');

        $users = [
            [
                'email' => 'sarah.chen@clinguard.local',
                'name' => 'Dr. Sarah Chen',
                'role_name' => 'clinician',
            ],
            [
                'email' => 'marcus.webb@clinguard.local',
                'name' => 'Marcus Webb',
                'role_name' => 'security_admin',
            ],
            [
                'email' => 'priya.nair@clinguard.local',
                'name' => 'Priya Nair',
                'role_name' => 'system_admin',
            ],
        ];

        foreach ($users as $u) {
            $roleId = DB::table('roles')->where('role_name', $u['role_name'])->value('id');
            User::query()->updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make('password'),
                    'role_id' => $roleId,
                    'organization_id' => $orgId,
                ]
            );
        }
    }
}
