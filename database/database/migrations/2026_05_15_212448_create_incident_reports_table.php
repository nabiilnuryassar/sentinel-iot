<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema mirrors PRD §13.2 `incident_reports`. Cascading delete on
     * `incident_id` keeps reports orphan-free when an incident is removed.
     */
    public function up(): void
    {
        Schema::create('incident_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')
                ->constrained('incidents')
                ->cascadeOnDelete();
            $table->text('report_markdown');
            $table->string('generated_by')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['incident_id', 'generated_at'], 'incident_reports_incident_generated_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_reports');
    }
};
