<?php

use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DashboardHealthController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\SecurityEventController;
use App\Http\Controllers\HealthController as HealthDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('api.health');
Route::get('/health/detailed', HealthDashboardController::class)->name('api.health.detailed');

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/dashboard/summary', DashboardController::class)->name('api.dashboard.summary');
    Route::get('/dashboard/health', [DashboardHealthController::class, 'health'])->middleware('throttle:10,1')->name('api.dashboard.health');
    Route::get('/devices', DeviceController::class)->name('api.devices.index');
    Route::get('/incidents', [IncidentController::class, 'index'])->name('api.incidents.index');
    Route::get('/security-events', SecurityEventController::class)->name('api.security-events.index');
    Route::post('/agent/ask', [AgentController::class, 'ask'])->name('api.agent.ask');
    Route::post('/agent/audit', [AgentController::class, 'audit'])->name('api.agent.audit');
    Route::post('/agent/analyze-incident/{incident}', [AgentController::class, 'analyzeIncident'])->name('api.agent.analyze-incident');
});
