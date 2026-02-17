<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpsertClientRequest;
use App\Models\Client;
use App\Models\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('clients/index', [
            'clients' => Client::query()
                ->select([
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'avatar_path',
                    'is_active',
                    'created_at',
                ])
                ->latest()
                ->get(),
            'files' => File::query()
                ->select(['id', 'disk', 'path', 'original_name', 'mime_type', 'size', 'table_id', 'related_id', 'created_at'])
                ->latest()
                ->get(),
        ]);
    }

    public function store(UpsertClientRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $client = isset($data['id']) ? Client::query()->findOrFail($data['id']) : new Client();

        $client->fill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'],
        ]);

        if (! empty($data['avatar_path'])) {
            $client->avatar_path = $data['avatar_path'];
        }

        if ($request->hasFile('avatar')) {
            if ($client->avatar_path && str_starts_with($client->avatar_path, 'clients/avatars/')) {
                Storage::disk('public')->delete($client->avatar_path);
            }

            $client->avatar_path = $request->file('avatar')->store('clients/avatars', 'public');
        }

        $client->save();

        return back()->with('success', isset($data['id']) ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        if ($client->avatar_path && str_starts_with($client->avatar_path, 'clients/avatars/')) {
            Storage::disk('public')->delete($client->avatar_path);
        }

        $client->delete();

        return back()->with('success', 'Cliente eliminado correctamente.');
    }
}
