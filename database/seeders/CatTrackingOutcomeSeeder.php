<?php

namespace Database\Seeders;

use App\Models\Tracking\CatTrackingOutcome;
use Illuminate\Database\Seeder;

class CatTrackingOutcomeSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['key' => 'no_answer', 'name' => 'No contestó', 'sort_order' => 10],
            ['key' => 'contacted', 'name' => 'Contactado', 'sort_order' => 20],
            ['key' => 'interested', 'name' => 'Interesado', 'sort_order' => 30],
            ['key' => 'not_interested', 'name' => 'No interesado', 'sort_order' => 40],
            ['key' => 'quote_sent', 'name' => 'Cotización enviada', 'sort_order' => 50],
        ];

        CatTrackingOutcome::query()->upsert($items, ['key'], ['name', 'sort_order', 'updated_at']);
    }
}
