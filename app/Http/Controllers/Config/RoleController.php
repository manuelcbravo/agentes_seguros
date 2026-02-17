<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Http\Requests\Config\UpsertRoleRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('config/roles/index', [
            'roles' => Role::query()
                ->with('permissions:id,name,guard_name')
                ->orderBy('name')
                ->get(['id', 'name', 'guard_name', 'created_at']),
            'permissions' => Permission::query()
                ->orderBy('name')
                ->get(['id', 'name', 'guard_name']),
        ]);
    }

    public function store(UpsertRoleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $role = isset($data['id']) ? Role::query()->findOrFail($data['id']) : new Role(['guard_name' => 'web']);

        $role->fill([
            'name' => $data['name'],
        ]);
        $role->save();
        $role->syncPermissions($data['permissions'] ?? []);

        return back()->with('success', isset($data['id']) ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $role->delete();

        return back()->with('success', 'Rol eliminado correctamente.');
    }
}
