<?php

namespace Database\Seeders;

use App\Models\CatMaritalStatus;
use Illuminate\Database\Seeder;

class CatMaritalStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'SOLTERO', 'name' => 'Soltero(a)'],
            ['code' => 'CASADO', 'name' => 'Casado(a)'],
            ['code' => 'UNION_LIBRE', 'name' => 'Union libre'],
            ['code' => 'DIVORCIADO', 'name' => 'Divorciado(a)'],
            ['code' => 'VIUDO', 'name' => 'Viudo(a)'],
            ['code' => 'SEPARADO', 'name' => 'Separado(a)'],
        ];

        foreach ($items as $item) {
            CatMaritalStatus::query()->updateOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name']],
            );
        }
    }
}
