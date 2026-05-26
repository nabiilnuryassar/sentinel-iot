<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `devices`. The composite index on
     * (status, last_seen_at) supports the dashboard's "online vs offline,
     * sorted by recency" query (Design D6).
     */
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique();
            $table->string('name');
            $table->string('type');
            $table->string('location')->nullable();
            $table->string('status')->default('unknown');
            $table->timestamp('last_seen_at')->nullable();
            $table->jsonb('metadata_json')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_seen_at'], 'devices_status_last_seen_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
