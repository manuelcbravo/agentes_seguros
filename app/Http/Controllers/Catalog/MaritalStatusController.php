<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertMaritalStatusRequest;
use App\Models\CatMaritalStatus;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MaritalStatusController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/marital-statuses/index', [
            'maritalStatuses' => CatMaritalStatus::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertMaritalStatusRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $maritalStatus = isset($data['id']) ? CatMaritalStatus::query()->findOrFail($data['id']) : new CatMaritalStatus();

        $maritalStatus->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $maritalStatus->save();

        return back()->with('success', isset($data['id']) ? 'Estado civil actualizado correctamente.' : 'Estado civil creado correctamente.');
    }

    public function destroy(CatMaritalStatus $maritalStatus): RedirectResponse
    {
        $maritalStatus->delete();

        return back()->with('success', 'Estado civil eliminado correctamente.');
    }
}
