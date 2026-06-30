<?php

namespace Tests\Traits;

use App\Models\Tenant;

/**
 * Helper trait for tests that need tenant-aware factory usage.
 *
 * This trait provides methods to create factories that automatically
 * inherit the tenant from an authenticated user.
 */
trait TenantAware
{
    /**
     * Create a tenant and return it for use in tests.
     */
    protected function createTenant(array $attributes = []): Tenant
    {
        return Tenant::factory()->create($attributes);
    }

    /**
     * Create a factory instance that inherits tenant from the given user.
     *
     * Usage:
     *   $user = User::factory()->create();
     *   $this->actingAs($user);
     *   $device = $this->factoryForUser(Device::class, $user)->create();
     */
    protected function factoryForUser(string $modelClass, $user)
    {
        return $modelClass::factory()->state([
            'tenant_id' => $user->tenant_id,
        ]);
    }
}
