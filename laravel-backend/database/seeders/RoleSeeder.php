<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['role_name' => 'clinician', 'permissions' => json_encode(['chat', 'detect', 'view_own_conversations'])],
            ['role_name' => 'security_admin', 'permissions' => json_encode(['chat', 'detect', 'policies', 'audit'])],
            ['role_name' => 'system_admin', 'permissions' => json_encode(['chat', 'detect', 'policies', 'audit', 'users', 'organizations'])],
        ];
        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['role_name' => $role['role_name']],
                array_merge($role, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
