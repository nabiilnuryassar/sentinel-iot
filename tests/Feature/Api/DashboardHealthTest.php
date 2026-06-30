<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('returns service health for authenticated user', function (): void {
    Http::fake();
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/dashboard/health')
        ->assertOk()
        ->assertJsonStructure([
            '*' => ['name', 'version', 'status', 'icon'],
        ])
        ->assertJsonCount(6);
});

it('rejects unauthenticated requests', function (): void {
    $this->getJson('/api/dashboard/health')->assertUnauthorized();
});
