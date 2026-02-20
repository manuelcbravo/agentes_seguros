<?php

namespace App\Models\Traits;

use App\Models\Tracking\TrackingActivity;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasTrackingActivities
{
    public function trackingActivities(): MorphMany
    {
        return $this->morphMany(TrackingActivity::class, 'trackable')->latest('occurred_at');
    }

    public function nextOpenActivities(): MorphMany
    {
        return $this->trackingActivities()
            ->whereNotNull('next_action_at')
            ->whereHas('status', fn ($query) => $query->where('key', 'open'));
    }
}
