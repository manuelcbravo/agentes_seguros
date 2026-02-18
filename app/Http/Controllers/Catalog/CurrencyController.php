<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertCurrencyRequest;
use App\Models\CatCurrency;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/currencies/index', [
            'currencies' => CatCurrency::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertCurrencyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $currency = isset($data['id']) ? CatCurrency::query()->findOrFail($data['id']) : new CatCurrency();

        $currency->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $currency->save();

        return back()->with('success', isset($data['id']) ? 'Moneda actualizada correctamente.' : 'Moneda creada correctamente.');
    }

    public function destroy(CatCurrency $currency): RedirectResponse
    {
        $currency->delete();

        return back()->with('success', 'Moneda eliminada correctamente.');
    }
}
