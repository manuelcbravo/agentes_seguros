<?php

namespace App\Models\Concerns;

use App\Models\User;

trait AssignsAgentOwnership
{
    protected static function bootAssignsAgentOwnership(): void
    {
        static::creating(function ($model): void {
            /** @var User|null $user */
            $user = auth()->user();

            if (! $user || ! $user->relationLoaded('agent')) {
                $user?->loadMissing('agent');
            }

            $defaultAgentId = $user?->agent?->id;

            if (! $defaultAgentId) {
                return;
            }

            if (self::isSuperAdmin($user)) {
                if (empty($model->agent_id)) {
                    $model->agent_id = $defaultAgentId;
                }

                return;
            }

            $model->agent_id = $defaultAgentId;
        });
    }

    private static function isSuperAdmin(?User $user): bool
    {
        if (! $user || ! method_exists($user, 'hasRole')) {
            return false;
        }

        return $user->hasRole('SuperAdmin')
            || $user->hasRole('superadmin')
            || $user->hasRole('super_admin');
    }
}
