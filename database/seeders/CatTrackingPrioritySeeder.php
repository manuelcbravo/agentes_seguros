<?php

namespace Database\Seeders;

use App\Models\Tracking\CatTrackingPriority;
use Illuminate\Database\Seeder;

class CatTrackingPrioritySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['key' => 'low', 'name' => 'Baja', 'level' => 1, 'sort_order' => 10],
            ['key' => 'medium', 'name' => 'Media', 'level' => 2, 'sort_order' => 20],
            ['key' => 'high', 'name' => 'Alta', 'level' => 3, 'sort_order' => 30],
        ];

        CatTrackingPriority::query()->upsert($items, ['key'], ['name', 'level', 'sort_order', 'updated_at']);
    }
}
