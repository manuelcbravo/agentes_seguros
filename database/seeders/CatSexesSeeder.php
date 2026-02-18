<?php

namespace Database\Seeders;

use App\Models\CatSex;
use Illuminate\Database\Seeder;

class CatSexesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'M', 'name' => 'Masculino'],
            ['code' => 'F', 'name' => 'Femenino'],
            ['code' => 'O', 'name' => 'Otro'],
        ];

        foreach ($items as $item) {
            CatSex::query()->updateOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name']],
            );
        }
    }
}
