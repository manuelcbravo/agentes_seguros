<?php

namespace Database\Seeders;

use App\Models\CatInsuranceCompany;
use App\Models\CatProductType;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            'AUTO' => 'Auto Tradicional',
            'GMM' => 'GMM Basico',
            'VIDA' => 'Vida Temporal',
        ];

        $companies = CatInsuranceCompany::query()->get(['id', 'code', 'name'])->keyBy('code');
        $productTypes = CatProductType::query()->get(['id', 'code'])->keyBy('code');

        foreach ($companies as $companyCode => $company) {
            foreach ($templates as $productTypeCode => $templateName) {
                $productType = $productTypes->get($productTypeCode);

                if (! $productType) {
                    continue;
                }

                $code = Str::upper(Str::slug($companyCode.'_'.$productTypeCode, '_'));
                $name = $company->name.' '.$templateName;

                Product::query()->updateOrCreate(
                    ['code' => $code],
                    [
                        'insurance_company_id' => $company->id,
                        'product_type_id' => $productType->id,
                        'name' => $name,
                    ],
                );
            }
        }
    }
}
