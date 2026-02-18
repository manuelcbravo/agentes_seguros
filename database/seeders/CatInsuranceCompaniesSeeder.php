<?php

namespace Database\Seeders;

use App\Models\CatInsuranceCompany;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatInsuranceCompaniesSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            'GNP',
            'AXA',
            'MetLife',
            'Qualitas',
            'HDI',
            'Mapfre',
            'Zurich',
            'Allianz',
            'Seguros Monterrey',
            'Banorte Seguros',
            'Inbursa',
            'Chubb',
        ];

        foreach ($items as $name) {
            CatInsuranceCompany::query()->updateOrCreate(
                ['code' => Str::upper(Str::slug($name, '_'))],
                ['name' => $name],
            );
        }
    }
}
