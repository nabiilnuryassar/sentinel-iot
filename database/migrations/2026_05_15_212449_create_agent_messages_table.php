<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `agent_messages`. `source` records the channel
     * the message came from (`web`, `telegram`, `system`); `metadata_json`
     * stores tool-call traces from the AI Agent service (Phase 4).
     */
    public function up(): void
    {
        Schema::create('agent_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('source');
            $table->text('prompt');
            $table->text('response')->nullable();
            $table->jsonb('metadata_json')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at'], 'agent_messages_user_created_idx');
            $table->index('source', 'agent_messages_source_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_messages');
    }
};
