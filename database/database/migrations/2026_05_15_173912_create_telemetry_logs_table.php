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
     * Schema mirrors PRD §13.2 `telemetry_logs`. The (device_id, received_at DESC)
     * covering index supports "latest N for a device" (Design D6). Laravel's
     * Schema builder only emits ASC indexes, so we drop to raw SQL for the
     * descending one to keep the index single-purpose.
     */
    public function up(): void
    {
        Schema::create('telemetry_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->index();
            $table->string('topic');
            $table->jsonb('payload_json');
            $table->double('temperature')->nullable();
            $table->double('humidity')->nullable();
            $table->double('battery')->nullable();
            $table->double('rssi')->nullable();
            $table->timestamp('received_at');
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement(
            'CREATE INDEX telemetry_logs_device_received_idx ON telemetry_logs (device_id, received_at DESC)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telemetry_logs');
    }
};
