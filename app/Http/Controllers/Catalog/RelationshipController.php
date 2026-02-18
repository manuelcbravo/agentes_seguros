<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertRelationshipRequest;
use App\Models\CatRelationship;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RelationshipController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/relationships/index', [
            'relationships' => CatRelationship::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertRelationshipRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $relationship = isset($data['id']) ? CatRelationship::query()->findOrFail($data['id']) : new CatRelationship();

        $relationship->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $relationship->save();

        return back()->with('success', isset($data['id']) ? 'Parentesco actualizado correctamente.' : 'Parentesco creado correctamente.');
    }

    public function destroy(CatRelationship $relationship): RedirectResponse
    {
        $relationship->delete();

        return back()->with('success', 'Parentesco eliminado correctamente.');
    }
}
