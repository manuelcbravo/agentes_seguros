<?php

use App\Http\Controllers\Config\AuditController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\Config\RoleController;
use App\Http\Controllers\Config\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
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

});
require __DIR__.'/settings.php';
