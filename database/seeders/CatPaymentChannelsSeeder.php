<?php

namespace Database\Seeders;

use App\Models\CatPaymentChannel;
use Illuminate\Database\Seeder;

class CatPaymentChannelsSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'efectivo', 'name' => 'Efectivo'],
            ['code' => 'transferencia', 'name' => 'Transferencia bancaria'],
            ['code' => 'deposito', 'name' => 'Depósito bancario'],
            ['code' => 'tarjeta_credito', 'name' => 'Tarjeta de crédito'],
            ['code' => 'tarjeta_debito', 'name' => 'Tarjeta de débito'],
            ['code' => 'domiciliacion', 'name' => 'Domiciliación bancaria'],
            ['code' => 'spei', 'name' => 'SPEI'],
            ['code' => 'cheque', 'name' => 'Cheque'],
            ['code' => 'cargo_automatico', 'name' => 'Cargo automático'],
            ['code' => 'otro', 'name' => 'Otro'],
        ];

        foreach ($items as $item) {
            CatPaymentChannel::query()->updateOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name']],
            );
        }
    }
}
