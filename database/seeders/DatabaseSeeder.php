<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // $this->call(RolesSeeder::class);
        // $this->call(RolePermissionSeeder::class);
        // $this->call(UsersTableSeeder::class);
        $this->call(CatCurrenciesSeeder::class);
        $this->call(CatMaritalStatusesSeeder::class);
        $this->call(CatSexesSeeder::class);
        $this->call(CatRelationshipsSeeder::class);
        $this->call(CatInsuranceCompaniesSeeder::class);
        $this->call(CatProductTypesSeeder::class);
        $this->call(CatPaymentChannelsSeeder::class);
        $this->call(CatTrackingActivityTypeSeeder::class);
        $this->call(CatTrackingChannelSeeder::class);
        $this->call(CatTrackingStatusSeeder::class);
        $this->call(CatTrackingPrioritySeeder::class);
        $this->call(CatTrackingOutcomeSeeder::class);
        $this->call(ProductsSeeder::class);
        
    }
}
