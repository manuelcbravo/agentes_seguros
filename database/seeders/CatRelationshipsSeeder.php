<?php

namespace Database\Seeders;

use App\Models\CatRelationship;
use Illuminate\Database\Seeder;

class CatRelationshipsSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'CONYUGE', 'name' => 'Conyuge'],
            ['code' => 'HIJO', 'name' => 'Hijo(a)'],
            ['code' => 'PADRE', 'name' => 'Padre'],
            ['code' => 'MADRE', 'name' => 'Madre'],
            ['code' => 'HERMANO', 'name' => 'Hermano(a)'],
            ['code' => 'CONCUBINO', 'name' => 'Concubino(a)'],
            ['code' => 'ABUELO', 'name' => 'Abuelo(a)'],
            ['code' => 'NIETO', 'name' => 'Nieto(a)'],
            ['code' => 'OTRO', 'name' => 'Otro'],
        ];

        foreach ($items as $item) {
            CatRelationship::query()->updateOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name']],
            );
        }
    }
}
