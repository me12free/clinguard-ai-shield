<?php

namespace Database\Seeders;

use App\Models\DetectionRule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DetectionRuleSeeder extends Seeder
{
    public function run(): void
    {
        $orgId = DB::table('organizations')->value('id');
        if (! $orgId) {
            return;
        }

        DetectionRule::query()->updateOrCreate(
            [
                'organization_id' => $orgId,
                'rule_type' => 'regex',
                'phi_category' => 'MRN',
            ],
            [
                'rule_pattern' => '\bMRN\s*:?\s*\d{6,}\b',
            ]
        );
    }
}
