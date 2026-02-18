<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertProductTypeRequest;
use App\Models\CatProductType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/product-types/index', [
            'productTypes' => CatProductType::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertProductTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $productType = isset($data['id']) ? CatProductType::query()->findOrFail($data['id']) : new CatProductType();

        $productType->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $productType->save();

        return back()->with('success', isset($data['id']) ? 'Tipo de producto actualizado correctamente.' : 'Tipo de producto creado correctamente.');
    }

    public function destroy(CatProductType $productType): RedirectResponse
    {
        $productType->delete();

        return back()->with('success', 'Tipo de producto eliminado correctamente.');
    }
}
