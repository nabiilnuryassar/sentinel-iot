<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `incidents`. `severity` and `status` are stored
     * as strings; the canonical values live as constants on the Incident model.
     * `affected_device_id` is the string `devices.device_id` (Design D7) and
     * intentionally not a hard FK so events can reference unknown devices.
     * `created_by` is a soft FK to `users.id` for the ERD's USERS creates
     * INCIDENTS edge.
     */
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('severity');
            $table->string('status');
            $table->string('affected_device_id')->nullable();
            $table->text('summary')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('recommendation')->nullable();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'severity'], 'incidents_status_severity_idx');
            $table->index('affected_device_id', 'incidents_affected_device_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
