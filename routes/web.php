<?php

use App\Http\Controllers\Config\AuditController;
use App\Http\Controllers\Accounting\AgentCommissionController;
use App\Http\Controllers\Accounting\AgentCommissionPaymentController;
use App\Http\Controllers\Accounting\AgentCommissionReconcileController;
use App\Http\Controllers\Catalog\CurrencyController;
use App\Http\Controllers\Catalog\InsuranceCompanyController;
use App\Http\Controllers\Catalog\MaritalStatusController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\ProductTypeController;
use App\Http\Controllers\Catalog\RelationshipController;
use App\Http\Controllers\Catalog\SexController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AgentLicenseController;
use App\Http\Controllers\AgentProfileController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\Clients\ClientSearchController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\Config\RoleController;
use App\Http\Controllers\Config\UserController;
use App\Http\Controllers\GoogleCalendarController;
use App\Http\Controllers\Search\GlobalSearchController;
use App\Http\Controllers\Polizas\AseguradoController;
use App\Http\Controllers\Polizas\BeneficiarioController;
use App\Http\Controllers\Polizas\PolizaController;
use App\Http\Controllers\Polizas\PolicyWizardController;
use App\Http\Controllers\Polizas\PolicyAiImportController;
use App\Http\Controllers\PublicAgentProfileController;
use App\Http\Controllers\Tracking\TrackingActivityController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');


Route::get('/a/{slug}', [PublicAgentProfileController::class, 'show'])->name('public-agent-profile.show');
Route::post('/a/{slug}/contact', [PublicAgentProfileController::class, 'contact'])->name('public-agent-profile.contact');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', fn () => Inertia::render('dashboard'))
        ->name('dashboard');


    Route::get('/calendario/google-calendar', [GoogleCalendarController::class, 'index'])->name('google-calendar.index');
    Route::get('/google-calendar/connect', [GoogleCalendarController::class, 'connect'])->name('google-calendar.connect');
    Route::get('/google-calendar/callback', [GoogleCalendarController::class, 'callback'])->name('google-calendar.callback');
    Route::post('/google-calendar/disconnect', [GoogleCalendarController::class, 'disconnect'])->name('google-calendar.disconnect');
    Route::get('/google-calendar/events', [GoogleCalendarController::class, 'eventsIndex']);
    Route::post('/google-calendar/events', [GoogleCalendarController::class, 'eventsStore']);
    Route::put('/google-calendar/events/{eventId}', [GoogleCalendarController::class, 'eventsUpdate']);
    Route::delete('/google-calendar/events/{eventId}', [GoogleCalendarController::class, 'eventsDestroy']);

    Route::prefix('config')->name('config.')->group(function () {
        Route::resource('users', UserController::class)->only(['index', 'store', 'destroy']);
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'destroy']);

        Route::get('audits', [AuditController::class, 'index'])->name('audits.index');
    });
    
    Route::resource('clients', ClientController::class)->only(['index', 'store', 'destroy']);
    Route::get('clients/profile/{id}', [ClientController::class, 'show'])->name('clients.profile');
    Route::get('clients/search', [ClientSearchController::class, 'index'])->name('clients.search');
    Route::resource('agents', AgentController::class)->only(['index', 'store', 'destroy']);

    Route::resource('agent-licenses', AgentLicenseController::class)
        ->only(['index', 'store', 'destroy'])
        ->parameters(['agent-licenses' => 'agentLicense']);

    Route::get('agent-profile', [AgentProfileController::class, 'edit'])->name('agent-profile.edit');
    Route::put('agent-profile', [AgentProfileController::class, 'update'])->name('agent-profile.update');


    Route::get('leads/kanban', [LeadController::class, 'kanban'])->name('leads.kanban');
    Route::get('leads/archived', [LeadController::class, 'archived'])->name('leads.archived.index');
    Route::get('leads/ganados', [LeadController::class, 'ganados'])->name('leads.ganados');
    Route::get('leads/no-interesados', [LeadController::class, 'noInteresados'])->name('leads.no-interesados');
    Route::get('leads/profile/{lead}', [LeadController::class, 'profileShow'])->name('leads.profile.show');
    Route::patch('leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('leads.update-status');
    Route::post('leads/{lead}/convert-to-client', [LeadController::class, 'convertToClient'])->name('leads.convertToClient');
    Route::post('leads/{lead}/archive', [LeadController::class, 'archive'])->name('leads.archive');
    Route::post('leads/{lead}/unarchive', [LeadController::class, 'unarchive'])->name('leads.unarchive');
    Route::resource('leads', LeadController::class)->only(['index', 'show', 'store', 'destroy']);

    Route::patch('files/{file}/rename', [FileController::class, 'rename'])->name('files.rename');
    Route::resource('files', FileController::class)->only(['index', 'store', 'destroy']);

    Route::get('polizas', [PolizaController::class, 'index'])->name('polizas.index');

    Route::get('polizas/wizard', [PolicyWizardController::class, 'create'])->name('polizas.wizard.create');
    Route::get('polizas/{policy}/wizard', [PolicyWizardController::class, 'edit'])->name('polizas.wizard.edit');
    Route::post('polizas/wizard/step1', [PolicyWizardController::class, 'saveStep1'])->name('polizas.wizard.step1');
    Route::post('polizas/wizard/client', [PolicyWizardController::class, 'storeClient'])->name('polizas.wizard.client.store');
    Route::post('polizas/wizard/step2', [PolicyWizardController::class, 'saveStep2'])->name('polizas.wizard.step2');
    Route::post('polizas/wizard/step3', [PolicyWizardController::class, 'saveStep3'])->name('polizas.wizard.step3');
    Route::post('polizas/wizard/step4', [PolicyWizardController::class, 'saveStep4'])->name('polizas.wizard.step4');
    Route::post('polizas/{policy}/finalizar', [PolicyWizardController::class, 'finish'])->name('polizas.wizard.finish');
    Route::post('polizas/wizard/guardar-salir', [PolicyWizardController::class, 'saveAndExit'])->name('polizas.wizard.save-exit');
    Route::post('polizas/{policy}/guardar-salir', [PolicyWizardController::class, 'saveAndExit'])->name('polizas.wizard.save-exit-policy');
    Route::delete('polizas/{id}', [PolizaController::class, 'destroy'])->name('polizas.destroy');
    Route::get('polizas/{policy}/ficha-tecnica', [PolizaController::class, 'sheet'])->name('polizas.sheet.show');

    Route::get('polizas/ia', [PolicyAiImportController::class, 'index'])->name('polizas.ai.index');
    Route::post('polizas/ia', [PolicyAiImportController::class, 'store'])->name('polizas.ai.store');
    Route::get('polizas/ia/{id}', [PolicyAiImportController::class, 'show'])->name('polizas.ai.show');
    Route::post('polizas/ia/{id}/files', [PolicyAiImportController::class, 'addFiles'])->name('polizas.ai.files.store');
    Route::post('polizas/ia/{id}/convert', [PolicyAiImportController::class, 'convert'])->name('polizas.ai.convert');
    Route::post('polizas/ia/{id}/retry', [PolicyAiImportController::class, 'retry'])->name('polizas.ai.retry');

    Route::get('policies/ai', [PolicyAiImportController::class, 'index']);
    Route::post('policies/ai', [PolicyAiImportController::class, 'store']);
    Route::get('policies/ai/{id}', [PolicyAiImportController::class, 'show']);
    Route::post('policies/ai/{id}/files', [PolicyAiImportController::class, 'addFiles']);
    Route::post('policies/ai/{id}/convert', [PolicyAiImportController::class, 'convert']);
    Route::post('policies/ai/{id}/retry', [PolicyAiImportController::class, 'retry']);

    Route::get('asegurados', [AseguradoController::class, 'index'])->name('asegurados.index');
    Route::post('asegurados', [AseguradoController::class, 'store'])->name('asegurados.store');
    Route::delete('asegurados/{id}', [AseguradoController::class, 'destroy'])->name('asegurados.destroy');

    Route::get('beneficiarios', [BeneficiarioController::class, 'index'])->name('beneficiarios.index');
    Route::get('beneficiarios/search', [BeneficiarioController::class, 'search'])->name('beneficiarios.search');
    Route::post('beneficiarios', [BeneficiarioController::class, 'store'])->name('beneficiarios.store');
    Route::delete('beneficiarios/{id}', [BeneficiarioController::class, 'destroy'])->name('beneficiarios.destroy');

    Route::prefix('accounting')->name('accounting.')->group(function () {
        Route::get('commissions', [AgentCommissionController::class, 'index'])->name('commissions.index');
        Route::post('commissions', [AgentCommissionController::class, 'store'])->name('commissions.store');
        Route::put('commissions/{commission}', [AgentCommissionController::class, 'update'])->name('commissions.update');
        Route::patch('commissions/{commission}/cancel', [AgentCommissionController::class, 'cancel'])->name('commissions.cancel');

        Route::get('commission-payments', [AgentCommissionPaymentController::class, 'index'])->name('commission_payments.index');
        Route::post('commission-payments', [AgentCommissionPaymentController::class, 'store'])->name('commission_payments.store');
        Route::put('commission-payments/{payment}', [AgentCommissionPaymentController::class, 'update'])->name('commission_payments.update');
        Route::delete('commission-payments/{payment}', [AgentCommissionPaymentController::class, 'destroy'])->name('commission_payments.destroy');

        Route::post('commission-reconcile', [AgentCommissionReconcileController::class, 'store'])->name('commissions.reconcile.store');
        Route::delete('commission-reconcile', [AgentCommissionReconcileController::class, 'destroy'])->name('commissions.reconcile.destroy');
    });

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

    Route::get('tracking', [TrackingActivityController::class, 'globalIndex'])->name('tracking.index');
    Route::get('tracking/entity', [TrackingActivityController::class, 'entityIndex'])->name('tracking.entity');
    Route::post('tracking/upsert', [TrackingActivityController::class, 'upsert'])->name('tracking.upsert');
    Route::delete('tracking/{id}', [TrackingActivityController::class, 'destroy'])->name('tracking.destroy');
    Route::get('tracking/pendientes', [TrackingActivityController::class, 'pendientes'])->name('tracking.pendientes');

    Route::get('/search/global', [GlobalSearchController::class, 'index'])->name('search.global');

});
require __DIR__.'/settings.php';
