<?php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use OwenIt\Auditing\Models\Audit;

class AuditController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('config/audits/index', [
            'audits' => Audit::query()
                ->select(['id', 'event', 'auditable_type', 'auditable_id', 'user_type', 'user_id', 'created_at'])
                ->latest()
                ->limit(200)
                ->get(),
        ]);
    }
}
