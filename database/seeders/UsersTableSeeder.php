<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('users')->delete();
        
        \DB::table('users')->insert(array (
            0 => 
            array (
                'id' => 1,
                'name' => 'manuel laravel',
                'email' => 'admin@laravelconmanuel.dev',
                'email_verified_at' => NULL,
                'password' => '$2y$12$DZ04lDKD51sqthz950L13OdBdijO8b8Ce3/d9FZ9ZcVVXES1lv/Jy',
                'remember_token' => NULL,
                'created_at' => '2026-02-05 18:08:25',
                'updated_at' => '2026-02-05 18:08:25',
                'two_factor_secret' => NULL,
                'two_factor_recovery_codes' => NULL,
                'two_factor_confirmed_at' => NULL,
            ),
        ));
        
        
    }
}