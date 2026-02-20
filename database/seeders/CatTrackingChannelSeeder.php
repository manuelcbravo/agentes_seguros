<?php

namespace Database\Seeders;

use App\Models\Tracking\CatTrackingChannel;
use Illuminate\Database\Seeder;

class CatTrackingChannelSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['key' => 'phone', 'name' => 'Teléfono', 'sort_order' => 10],
            ['key' => 'whatsapp', 'name' => 'WhatsApp', 'sort_order' => 20],
            ['key' => 'email', 'name' => 'Email', 'sort_order' => 30],
            ['key' => 'in_person', 'name' => 'Presencial', 'sort_order' => 40],
            ['key' => 'sms', 'name' => 'SMS', 'sort_order' => 50],
        ];

        CatTrackingChannel::query()->upsert($items, ['key'], ['name', 'sort_order', 'updated_at']);
    }
}
