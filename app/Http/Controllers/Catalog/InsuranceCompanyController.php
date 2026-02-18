<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\UpsertInsuranceCompanyRequest;
use App\Models\CatInsuranceCompany;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InsuranceCompanyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('catalogs/insurance-companies/index', [
            'insuranceCompanies' => CatInsuranceCompany::query()
                ->select(['id', 'code', 'name', 'created_at'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(UpsertInsuranceCompanyRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $company = isset($data['id']) ? CatInsuranceCompany::query()->findOrFail($data['id']) : new CatInsuranceCompany();

        $company->fill([
            'code' => mb_strtoupper($data['code']),
            'name' => $data['name'],
        ]);
        $company->save();

        return back()->with('success', isset($data['id']) ? 'Aseguradora actualizada correctamente.' : 'Aseguradora creada correctamente.');
    }

    public function destroy(CatInsuranceCompany $insuranceCompany): RedirectResponse
    {
        $insuranceCompany->delete();

        return back()->with('success', 'Aseguradora eliminada correctamente.');
    }
}
