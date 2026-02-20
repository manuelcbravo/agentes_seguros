<?php

namespace Database\Seeders;

use App\Models\Tracking\CatTrackingStatus;
use Illuminate\Database\Seeder;

class CatTrackingStatusSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['key' => 'open', 'name' => 'Abierto', 'sort_order' => 10],
            ['key' => 'done', 'name' => 'Completado', 'sort_order' => 20],
            ['key' => 'canceled', 'name' => 'Cancelado', 'sort_order' => 30],
        ];

        CatTrackingStatus::query()->upsert($items, ['key'], ['name', 'sort_order', 'updated_at']);
    }
}
