<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('policy_name');
            $table->json('phi_categories')->nullable();
            $table->string('enforcement_action')->default('redact');
            $table->decimal('confidence_threshold', 5, 4)->default(0.85);
            $table->timestamps();
        });

        Schema::create('allowlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('service_name');
            $table->string('service_domain')->nullable();
            $table->timestamp('approval_date')->nullable();
            $table->timestamps();
        });

        Schema::create('detection_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('rule_type');
            $table->text('rule_pattern')->nullable();
            $table->string('phi_category');
            $table->timestamps();
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('event_type');
            $table->json('detected_categories')->nullable();
            $table->binary('encrypted_details')->nullable();
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('prompt_redacted')->nullable();
            $table->text('response_summary')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('detection_rules');
        Schema::dropIfExists('allowlists');
        Schema::dropIfExists('policies');
    }
};
