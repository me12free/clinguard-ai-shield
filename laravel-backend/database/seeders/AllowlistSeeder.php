<?php

namespace Database\Seeders;

use App\Models\Allowlist;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AllowlistSeeder extends Seeder
{
    public function run(): void
    {
        $orgId = DB::table('organizations')->value('id');
        if (! $orgId) {
            return;
        }

        Allowlist::query()->updateOrCreate(
            [
                'organization_id' => $orgId,
                'service_name' => 'OpenAI API',
            ],
            [
                'service_domain' => 'api.openai.com',
                'approval_date' => now(),
            ]
        );
    }
}
