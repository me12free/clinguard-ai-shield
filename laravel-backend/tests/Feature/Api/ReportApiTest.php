<?php

namespace Tests\Feature\Api;

use App\Models\AuditEvent;
use App\Models\Conversation;
use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\PolicySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, OrganizationSeeder::class, PolicySeeder::class]);
    }

    private function createUserWithRole(string $roleName): User
    {
        $roleId = DB::table('roles')->where('role_name', $roleName)->value('id');
        $orgId = DB::table('organizations')->value('id');

        return User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);
    }

    public function test_reports_summary_returns_200_for_clinician_with_personal_scope(): void
    {
        $user = $this->createUserWithRole('clinician');
        Conversation::query()->create([
            'user_id' => $user->id,
            'prompt_redacted' => '[NAME] test',
            'response_summary' => 'ok',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary');
        $response->assertOk();
        $response->assertJsonPath('scope', 'personal');
        $response->assertJsonStructure([
            'generated_at',
            'scope',
            'scope_label',
            'kpis',
            'series',
            'composed_daily',
            'tables',
            'breakdowns',
        ]);
    }

    public function test_reports_summary_returns_organization_scope_for_security_admin(): void
    {
        $user = $this->createUserWithRole('security_admin');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary?scope=global');
        $response->assertOk();
        $response->assertJsonPath('scope', 'organization');
        $response->assertJsonPath('capabilities.organization_reports', true);
    }

    public function test_reports_summary_returns_global_scope_for_system_admin(): void
    {
        $user = $this->createUserWithRole('system_admin');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary');
        $response->assertOk();
        $response->assertJsonPath('scope', 'global');
        $this->assertIsArray($response->json('tables.organizations_summary'));
        $this->assertNotEmpty($response->json('tables.organizations_summary'));
    }

    public function test_reports_summary_403_for_user_without_reporting_permissions(): void
    {
        $roleId = DB::table('roles')->insertGetId([
            'role_name' => 'no_reports_role',
            'permissions' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $orgId = DB::table('organizations')->value('id');
        $user = User::factory()->create(['role_id' => $roleId, 'organization_id' => $orgId]);

        $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary')->assertForbidden();
    }

    public function test_reports_export_returns_pdf_for_system_admin(): void
    {
        if (! class_exists('Barryvdh\\DomPDF\\Facade\\Pdf')) {
            $this->markTestSkipped('barryvdh/laravel-dompdf not installed; run composer update in laravel-backend.');
        }

        $user = $this->createUserWithRole('system_admin');

        $response = $this->actingAs($user, 'sanctum')->get('/api/reports/export');
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_organization_report_includes_audit_breakdown_when_events_exist(): void
    {
        $user = $this->createUserWithRole('security_admin');
        AuditEvent::query()->create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'chat',
            'detected_categories' => ['NAME', 'DATE'],
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary');
        $response->assertOk();
        $json = $response->json();
        $this->assertNotEmpty($json['series']['audit_by_event_type']);
        $this->assertNotEmpty($json['breakdowns']['phi_categories_in_audits']);
    }

    public function test_reports_summary_applies_dynamic_filters(): void
    {
        $user = $this->createUserWithRole('security_admin');
        AuditEvent::query()->create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'chat',
            'detected_categories' => ['NAME'],
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);
        AuditEvent::query()->create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'event_type' => 'policy_update',
            'detected_categories' => ['DATE'],
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports/summary?event_types[]=chat&phi_categories[]=NAME');
        $response->assertOk();
        $response->assertJsonPath('meta.applied_filters.event_types.0', 'chat');
        $rows = $response->json('series.audit_by_event_type');
        $this->assertCount(1, $rows);
        $this->assertSame('chat', $rows[0]['event_type']);
    }
}
