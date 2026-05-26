<?php

use App\Models\SecurityEvent;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lists security events for an authenticated user', function (): void {
    $user = User::factory()->create();
    SecurityEvent::factory()->count(3)->create();

    $this->actingAs($user)
        ->get(route('security-events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('security-events/index')
            ->has('events.data', 3)
            ->has('event_types')
            ->has('filters')
        );
});

it('filters security events by severity', function (): void {
    $user = User::factory()->create();
    SecurityEvent::factory()->severity(SecurityEvent::SEVERITY_HIGH)->count(2)->create();
    SecurityEvent::factory()->severity(SecurityEvent::SEVERITY_LOW)->count(4)->create();

    $this->actingAs($user)
        ->get(route('security-events.index', ['severity' => 'high']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('security-events/index')
            ->has('events.data', 2)
        );
});

it('rejects invalid severity values', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('security-events.index', ['severity' => 'bogus']))
        ->assertSessionHasErrors('severity');
});
