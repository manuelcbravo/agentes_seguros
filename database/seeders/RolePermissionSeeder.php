<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'audits.view',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ];

        foreach ($permissions as $permissionName) {
            Permission::query()->firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $developerRole = Role::query()->firstOrCreate([
            'name' => 'desarrollador',
            'guard_name' => 'web',
        ]);

        $developerRole->syncPermissions(Permission::query()->pluck('name')->all());
    }
}
