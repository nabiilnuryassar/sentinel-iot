<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `security_events`. Composite (severity, detected_at DESC)
     * index powers the "high-severity, most recent first" dashboard list
     * (Design D6, D7).
     */
    public function up(): void
    {
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->string('severity');
            $table->string('source_client_id')->nullable();
            $table->string('topic')->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('detected_at');
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement(
            'CREATE INDEX security_events_severity_detected_idx ON security_events (severity, detected_at DESC)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};
