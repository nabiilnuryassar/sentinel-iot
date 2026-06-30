<?php

namespace App\Models\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Trait BelongsToTenant
 *
 * Automatically scopes all queries to the current tenant and
 * sets tenant_id on model creation.
 */
trait BelongsToTenant
{
    /**
     * Boot the trait and add global scope.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Add global scope to filter by tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (! Auth::hasUser()) {
                return;
            }

            $tenantId = Auth::user()?->tenant_id;

            if ($tenantId) {
                $builder->where($builder->getModel()->getTable().'.tenant_id', $tenantId);
            }
        });

        // Automatically set tenant_id when creating
        static::creating(function ($model) {
            if (! Auth::hasUser()) {
                return;
            }

            $tenantId = Auth::user()?->tenant_id;

            if ($tenantId && ! $model->tenant_id) {
                $model->tenant_id = $tenantId;
            }
        });
    }

    /**
     * Get the tenant that owns the model.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Remove the tenant scope (useful for admin/system operations).
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }

    /**
     * Scope to a specific tenant.
     */
    public function scopeForTenant(Builder $query, Tenant $tenant): Builder
    {
        return $query->withoutGlobalScope('tenant')->where('tenant_id', $tenant->id);
    }

    /**
     * Scope to all tenants (admin only).
     */
    public function scopeAllTenants(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }
}
