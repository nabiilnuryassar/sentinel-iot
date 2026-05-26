<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `device_policies`. `device_id` is the string
     * `devices.device_id` (Design D7) and intentionally not a hard FK to keep
     * the audit tool able to reference policies for unknown devices.
     * Composite unique index prevents duplicate policy rows for the same
     * (device, client, topic) triple.
     */
    public function up(): void
    {
        Schema::create('device_policies', function (Blueprint $table) {
            $table->id();
            $table->string('device_id');
            $table->string('allowed_client_id');
            $table->string('allowed_topic');
            $table->boolean('can_publish')->default(true);
            $table->boolean('can_subscribe')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(
                ['device_id', 'allowed_client_id', 'allowed_topic'],
                'device_policies_device_client_topic_uq'
            );
            $table->index(['device_id', 'is_active'], 'device_policies_device_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_policies');
    }
};
