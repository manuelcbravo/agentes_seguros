<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPolicyAiImportJob;
use App\Models\PolicyAiImport;
use App\Models\PolicyWizardDraft;
use App\Services\PolicyAi\PolicyAiMapper;
use App\Support\Filesystem\MediaDisk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class PolicyAiImportController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) $request->user()->agent_id;

        $imports = PolicyAiImport::query()
            ->where('agent_id', $agentId)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Polizas/AI/Index', [
            'imports' => $imports->through(fn (PolicyAiImport $import) => $this->serializeImport($import)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                File::types(['pdf', 'jpg', 'jpeg', 'png'])->max(20 * 1024),
                'mimetypes:application/pdf,image/jpeg,image/png',
            ],
        ]);

        $agentId = (string) $request->user()->agent_id;
        $file = $validated['file'];
        $uuid = (string) \Illuminate\Support\Str::uuid();
        $extension = $file->guessExtension() ?: $file->extension() ?: 'bin';
        $path = "policy-ai/{$agentId}/{$uuid}.{$extension}";
        $disk = MediaDisk::name();

        $file->storeAs("policy-ai/{$agentId}", "{$uuid}.{$extension}", $disk);

        $import = PolicyAiImport::query()->create([
            'id' => $uuid,
            'agent_id' => $agentId,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'disk' => $disk,
            'path' => $path,
            'status' => PolicyAiImport::STATUS_UPLOADED,
        ]);

        ProcessPolicyAiImportJob::dispatch($import->id);

        return back()->with('success', 'Archivo cargado. Procesando con IA…');
    }

    public function show(Request $request, string $id): Response
    {
        $import = $this->ownedImport($request, $id);

        return Inertia::render('Polizas/AI/Show', [
            'import' => $this->serializeImport($import, true),
        ]);
    }

    public function convert(Request $request, string $id, PolicyAiMapper $mapper): RedirectResponse
    {
        $import = $this->ownedImport($request, $id);

        if (! in_array($import->status, [PolicyAiImport::STATUS_READY, PolicyAiImport::STATUS_NEEDS_REVIEW], true)) {
            abort(422, 'Este análisis aún no puede convertirse.');
        }

        $agentId = (string) $request->user()->agent_id;
        $draftData = $mapper->toWizardDraft($import->ai_data ?? [], $agentId);
        $draftData['missing_fields'] = $import->missing_fields ?? [];

        PolicyWizardDraft::query()->updateOrCreate(
            ['agent_id' => $agentId],
            [
                'source_type' => 'policy_ai_import',
                'source_id' => $import->id,
                'data' => $draftData,
            ],
        );

        return to_route('polizas.wizard.create')->with('success', 'Borrador IA listo. Revisa y completa en el wizard.');
    }

    public function retry(Request $request, string $id): RedirectResponse
    {
        $import = $this->ownedImport($request, $id);

        if (! in_array($import->status, [PolicyAiImport::STATUS_FAILED, PolicyAiImport::STATUS_NEEDS_REVIEW], true)) {
            return back();
        }

        $import->update(['status' => PolicyAiImport::STATUS_UPLOADED, 'error_message' => null]);
        ProcessPolicyAiImportJob::dispatch($import->id, true);

        return back()->with('success', 'Reprocesando archivo con IA…');
    }

    private function ownedImport(Request $request, string $id): PolicyAiImport
    {
        $import = PolicyAiImport::query()->findOrFail($id);

        if ((string) $import->agent_id !== (string) $request->user()->agent_id) {
            abort(403);
        }

        return $import;
    }

    private function serializeImport(PolicyAiImport $import, bool $full = false): array
    {
        return [
            'id' => $import->id,
            'original_filename' => $import->original_filename,
            'status' => $import->status,
            'created_at' => $import->created_at?->toISOString(),
            'error_message' => $import->error_message,
            'missing_fields' => $import->missing_fields ?? [],
            'ai_data' => $import->ai_data,
            'ai_confidence' => $import->ai_confidence,
            'extracted_text' => $full ? $import->extracted_text : null,
            'file_url' => Storage::disk($import->disk)->url($import->path),
            'took_ms' => $import->took_ms,
        ];
    }
}
