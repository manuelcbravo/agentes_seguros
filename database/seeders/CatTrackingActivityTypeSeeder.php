<?php

namespace Database\Seeders;

use App\Models\Tracking\CatTrackingActivityType;
use Illuminate\Database\Seeder;

class CatTrackingActivityTypeSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['key' => 'note', 'name' => 'Nota', 'sort_order' => 10],
            ['key' => 'call', 'name' => 'Llamada', 'sort_order' => 20],
            ['key' => 'whatsapp', 'name' => 'WhatsApp', 'sort_order' => 30],
            ['key' => 'email', 'name' => 'Email', 'sort_order' => 40],
            ['key' => 'meeting', 'name' => 'Reunión', 'sort_order' => 50],
            ['key' => 'task', 'name' => 'Tarea', 'sort_order' => 60],
            ['key' => 'status_change', 'name' => 'Cambio de estatus', 'sort_order' => 70],
        ];

        CatTrackingActivityType::query()->upsert($items, ['key'], ['name', 'sort_order', 'updated_at']);
    }
}
