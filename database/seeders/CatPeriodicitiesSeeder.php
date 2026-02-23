<?php

namespace Database\Seeders;

use App\Models\CatPeriodicity;
use Illuminate\Database\Seeder;

class CatPeriodicitiesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Mensual', 'code' => 'MONTHLY', 'sort_order' => 1],
            ['name' => 'Bimestral', 'code' => 'BIMONTHLY', 'sort_order' => 2],
            ['name' => 'Trimestral', 'code' => 'QUARTERLY', 'sort_order' => 3],
            ['name' => 'Semestral', 'code' => 'SEMIANNUAL', 'sort_order' => 4],
            ['name' => 'Anual', 'code' => 'ANNUAL', 'sort_order' => 5],
        ];

        foreach ($items as $item) {
            CatPeriodicity::query()->updateOrCreate(
                ['code' => $item['code']],
                $item + ['is_active' => true],
            );
        }
    }
}
