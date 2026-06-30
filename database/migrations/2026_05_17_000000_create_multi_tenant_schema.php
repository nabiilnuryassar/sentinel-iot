<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create tenants table
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('description')->nullable();
            $table->jsonb('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('slug');
            $table->index('is_active');
        });

        // Create default tenant
        DB::table('tenants')->insert([
            'name' => 'Default Tenant',
            'slug' => 'default',
            'contact_email' => 'admin@sentinel.local',
            'description' => 'Default tenant for existing data',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add tenant_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to devices
        Schema::table('devices', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to telemetry_logs
        Schema::table('telemetry_logs', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to security_events
        Schema::table('security_events', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to incidents
        Schema::table('incidents', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to incident_reports
        Schema::table('incident_reports', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to agent_messages
        Schema::table('agent_messages', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to device_policies
        Schema::table('device_policies', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to agent_conversations
        Schema::table('agent_conversations', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Add tenant_id to agent_conversation_messages
        Schema::table('agent_conversation_messages', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->index('tenant_id');
        });

        // Migrate existing data to default tenant
        $defaultTenantId = DB::table('tenants')->where('slug', 'default')->value('id');

        DB::table('users')->update(['tenant_id' => $defaultTenantId]);
        DB::table('devices')->update(['tenant_id' => $defaultTenantId]);
        DB::table('telemetry_logs')->update(['tenant_id' => $defaultTenantId]);
        DB::table('security_events')->update(['tenant_id' => $defaultTenantId]);
        DB::table('incidents')->update(['tenant_id' => $defaultTenantId]);
        DB::table('incident_reports')->update(['tenant_id' => $defaultTenantId]);
        DB::table('agent_messages')->update(['tenant_id' => $defaultTenantId]);
        DB::table('device_policies')->update(['tenant_id' => $defaultTenantId]);
        DB::table('agent_conversations')->update(['tenant_id' => $defaultTenantId]);
        DB::table('agent_conversation_messages')->update(['tenant_id' => $defaultTenantId]);

        // Make tenant_id NOT NULL after migration
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('telemetry_logs', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('security_events', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('incidents', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('incident_reports', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('agent_messages', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('device_policies', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('agent_conversations', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        Schema::table('agent_conversation_messages', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove tenant_id from all tables
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('telemetry_logs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('security_events', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('incidents', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('incident_reports', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('agent_messages', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('device_policies', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('agent_conversations', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        // Drop tenants table
        Schema::dropIfExists('tenants');
    }
};
