<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\SecurityEventController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\TokenController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:5,1');
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::middleware(['auth'])->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/{device_id}', [DeviceController::class, 'show'])->name('devices.show');
    Route::post('/devices/{device_id}/quarantine', [DeviceController::class, 'quarantine'])->name('devices.quarantine');
    Route::post('/tokens/rotate', [TokenController::class, 'rotate'])->name('tokens.rotate');

    Route::get('/telemetry', [TelemetryController::class, 'index'])->name('telemetry.index');

    Route::get('/security-events', [SecurityEventController::class, 'index'])->name('security-events.index');

    Route::resource('incidents', IncidentController::class)->only(['index', 'show', 'store', 'update']);
    Route::post('/incidents/{incident}/generate-report', [IncidentController::class, 'generateReport'])->name('incidents.generate-report');

    Route::get('/agent', [AgentController::class, 'index'])->name('agent.index');
    Route::post('/agent/ask', [AgentController::class, 'ask'])->name('agent.ask')->middleware('throttle:10,1');
    Route::post('/agent/stream', [AgentController::class, 'stream'])->name('agent.stream')->middleware('throttle:10,1');
});
