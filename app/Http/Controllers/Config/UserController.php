<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Http\Requests\Config\UpsertUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('config/users/index', [
            'users' => User::query()
                ->with('roles:id,name')
                ->select(['id', 'name', 'email', 'created_at'])
                ->latest()
                ->get(),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(UpsertUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = isset($data['id']) ? User::query()->findOrFail($data['id']) : new User();

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $user->fill($payload);
        $user->save();
        $user->syncRoles($data['roles'] ?? []);

        return back()->with('success', isset($data['id']) ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }
}
