<?php

namespace Database\Seeders;

use App\Models\Policy;
use Illuminate\Database\Seeder;

class PolicySeeder extends Seeder
{
    public function run(): void
    {
        $orgId = \Illuminate\Support\Facades\DB::table('organizations')->value('id');
        if (!$orgId) {
            return;
        }
        Policy::updateOrCreate(
            [
                'organization_id' => $orgId,
                'policy_name' => 'Default PHI Policy',
            ],
            [
                'phi_categories' => ['NAME', 'MRN', 'SSN', 'EMAIL', 'PHONE', 'DATE', 'ID_NUMBER', 'HIGH_ENTROPY'],
                'enforcement_action' => 'redact',
                'confidence_threshold' => 0.85,
            ]
        );
    }
}
