<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['role_name' => 'clinician', 'permissions' => json_encode([
                'chat',
                'detect',
                'view_own_conversations',
            ])],
            ['role_name' => 'security_admin', 'permissions' => json_encode([
                'chat',
                'detect',
                'policies',
                'audit',
                'view_org_conversations',
            ])],
            ['role_name' => 'system_admin', 'permissions' => json_encode([
                'chat',
                'detect',
                'policies',
                'audit',
                'view_org_conversations',
                'view_all_conversations',
                'manage_users',
                'manage_organizations',
            ])],
        ];
        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['role_name' => $role['role_name']],
                array_merge($role, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
