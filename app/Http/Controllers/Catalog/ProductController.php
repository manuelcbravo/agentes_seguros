<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertProductRequest;
use App\Models\CatInsuranceCompany;
use App\Models\CatProductType;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/products/index', [
            'products' => Product::query()
                ->with([
                    'insuranceCompany:id,name',
                    'productType:id,name',
                ])
                ->select(['id', 'insurance_company_id', 'product_type_id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
            'insuranceCompanies' => CatInsuranceCompany::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'productTypes' => CatProductType::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(UpsertProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $product = isset($data['id']) ? Product::query()->findOrFail($data['id']) : new Product();

        $product->fill([
            'insurance_company_id' => $data['insurance_company_id'],
            'product_type_id' => $data['product_type_id'],
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $product->save();

        return back()->with('success', isset($data['id']) ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Producto eliminado correctamente.');
    }
}
