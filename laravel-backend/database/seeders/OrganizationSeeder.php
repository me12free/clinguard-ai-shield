<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('organizations')->updateOrInsert(
            ['name' => 'Default Organization'],
            [
                'registration_number' => null,
                'subscription_tier' => 'standard',
                'configuration' => json_encode(['phi_default_action' => 'redact']),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
