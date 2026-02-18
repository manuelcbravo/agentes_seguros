<?php

namespace Database\Seeders;

use App\Models\CatCurrency;
use Illuminate\Database\Seeder;

class CatCurrenciesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'MXN', 'name' => 'Peso mexicano'],
            ['code' => 'USD', 'name' => 'Dolar estadounidense'],
        ];

        foreach ($items as $item) {
            CatCurrency::query()->updateOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name']],
            );
        }
    }
}
