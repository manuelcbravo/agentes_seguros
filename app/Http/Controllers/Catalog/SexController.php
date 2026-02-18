<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertSexRequest;
use App\Models\CatSex;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SexController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/sexes/index', [
            'sexes' => CatSex::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertSexRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $sex = isset($data['id']) ? CatSex::query()->findOrFail($data['id']) : new CatSex();

        $sex->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $sex->save();

        return back()->with('success', isset($data['id']) ? 'Sexo actualizado correctamente.' : 'Sexo creado correctamente.');
    }

    public function destroy(CatSex $sex): RedirectResponse
    {
        $sex->delete();

        return back()->with('success', 'Sexo eliminado correctamente.');
    }
}
