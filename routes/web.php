<?php

use App\Http\Controllers\Config\AuditController;
use App\Http\Controllers\Catalog\CurrencyController;
use App\Http\Controllers\Catalog\InsuranceCompanyController;
use App\Http\Controllers\Catalog\MaritalStatusController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\ProductTypeController;
use App\Http\Controllers\Catalog\RelationshipController;
use App\Http\Controllers\Catalog\SexController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\Config\RoleController;
use App\Http\Controllers\Config\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', fn () => Inertia::render('dashboard'))
        ->name('dashboard');

    Route::prefix('config')->name('config.')->group(function () {
        Route::resource('users', UserController::class)->only(['index', 'store', 'destroy']);
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'destroy']);

        Route::get('audits', [AuditController::class, 'index'])->name('audits.index');
    });
    
    Route::resource('clients', ClientController::class)->only(['index', 'store', 'destroy']);
    Route::resource('files', FileController::class)->only(['index', 'store', 'destroy']);
    Route::prefix('catalogs')->name('catalogs.')->group(function () {
        Route::resource('currencies', CurrencyController::class)->only(['index', 'store', 'destroy']);
        Route::resource('marital-statuses', MaritalStatusController::class)
            ->only(['index', 'store', 'destroy'])
            ->parameters(['marital-statuses' => 'maritalStatus']);
        Route::resource('sexes', SexController::class)->only(['index', 'store', 'destroy']);
        Route::resource('relationships', RelationshipController::class)->only(['index', 'store', 'destroy']);
        Route::resource('insurance-companies', InsuranceCompanyController::class)
            ->only(['index', 'store', 'destroy'])
            ->parameters(['insurance-companies' => 'insuranceCompany']);
        Route::resource('product-types', ProductTypeController::class)
            ->only(['index', 'store', 'destroy'])
            ->parameters(['product-types' => 'productType']);
        Route::resource('products', ProductController::class)->only(['index', 'store', 'destroy']);
    });

});
require __DIR__.'/settings.php';
