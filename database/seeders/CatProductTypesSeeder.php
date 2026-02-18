<?php

namespace Database\Seeders;

use App\Models\CatProductType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatProductTypesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            'Vida',
            'GMM',
            'Auto',
            'Hogar',
            'Ahorro Retiro',
            'Empresarial',
            'Viaje',
        ];

        foreach ($items as $name) {
            CatProductType::query()->updateOrCreate(
                ['code' => Str::upper(Str::slug($name, '_'))],
                ['name' => $name],
            );
        }
    }
}
