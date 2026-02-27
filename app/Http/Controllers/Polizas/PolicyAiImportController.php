<?php

namespace App\Http\Controllers\Polizas;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPolicyAiImportJob;
use App\Models\Client;
use App\Models\PolicyAiImport;
use App\Models\PolicyAiImportFile;
use App\Models\PolicyWizardDraft;
use App\Services\PolicyAi\PolicyAiMapper;
use App\Support\Filesystem\MediaDisk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PolicyAiImportController extends Controller
{
    public function index(Request $request): Response
    {
        $agentId = (string) $request->user()->agent_id;

        $imports = PolicyAiImport::query()
            ->where('agent_id', $agentId)
            ->with('client:id,first_name,middle_name,last_name,second_last_name')
            ->with(['files' => fn ($query) => $query->orderBy('created_at')])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $clients = Client::query()
            ->where('agent_id', $agentId)
            ->select(['id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'email', 'phone', 'rfc'])
            ->orderBy('first_name')
            ->limit(150)
            ->get();

        return Inertia::render('Polizas/AI/Index', [
            'imports' => $imports->through(fn (PolicyAiImport $import) => $this->serializeImport($import)),
            'clients' => $clients->map(fn (Client $client) => [
                'id' => $client->id,
                'full_name' => trim(implode(' ', array_filter([
                    $client->first_name,
                    $client->middle_name,
                    $client->last_name,
                    $client->second_last_name,
                ]))),
                'email' => $client->email,
                'phone' => $client->phone,
                'rfc' => $client->rfc,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => [
                'required',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('agent_id', (string) $request->user()->agent_id)),
            ],
            'files' => ['required', 'array', 'min:1', 'max:5'],
            'files.*' => [
                'required',
                File::types(['pdf', 'jpg', 'jpeg', 'png'])->max(20 * 1024),
                'mimetypes:application/pdf,image/jpeg,image/png',
            ],
        ]);

        $agentId = (string) $request->user()->agent_id;
        $firstFile = $validated['files'][0];

        $import = PolicyAiImport::query()->create([
            'agent_id' => $agentId,
            'client_id' => $validated['client_id'],
            'original_filename' => $firstFile->getClientOriginalName(),
            'mime_type' => $firstFile->getMimeType() ?: 'application/octet-stream',
            'disk' => MediaDisk::name(),
            'path' => '',
            'status' => PolicyAiImport::STATUS_UPLOADED,
        ]);

        $storedFiles = $this->storeImportFiles($import, $validated['files']);

        if ($storedFiles->isNotEmpty()) {
            $primaryFile = $storedFiles->first();
            $import->update([
                'original_filename' => $primaryFile->original_filename,
                'mime_type' => $primaryFile->mime_type,
                'disk' => $primaryFile->disk,
                'path' => $primaryFile->path,
            ]);
        }

        ProcessPolicyAiImportJob::dispatch($import->id);

        return back()->with('success', 'Archivos cargados. Procesando con IA…');
    }

    public function addFiles(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:5'],
            'files.*' => [
                'required',
                File::types(['pdf', 'jpg', 'jpeg', 'png'])->max(20 * 1024),
                'mimetypes:application/pdf,image/jpeg,image/png',
            ],
        ]);

        $import = $this->ownedImport($request, $id);

        if (($import->files()->count() + count($validated['files'])) > 5) {
            return back()->withErrors([
                'files' => 'Cada registro de Póliza IA permite máximo 5 archivos.',
            ]);
        }

        $storedFiles = $this->storeImportFiles($import, $validated['files']);

        if (($import->path === null || $import->path === '') && $storedFiles->isNotEmpty()) {
            $primaryFile = $storedFiles->first();
            $import->update([
                'original_filename' => $primaryFile->original_filename,
                'mime_type' => $primaryFile->mime_type,
                'disk' => $primaryFile->disk,
                'path' => $primaryFile->path,
            ]);
        }

        $import->update([
            'status' => PolicyAiImport::STATUS_UPLOADED,
            'error_message' => null,
        ]);

        ProcessPolicyAiImportJob::dispatch($import->id, true);

        return back()->with('success', 'Se agregaron archivos y se reintentó el análisis.');
    }

    public function show(Request $request, string $id): Response
    {
        $import = $this->ownedImport($request, $id);
        $import->load(['files' => fn ($query) => $query->orderBy('created_at')]);

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

    public function process(Request $request, PolicyAiImport $import): RedirectResponse
    {
        $this->authorizeImport($request, $import);

        if ($import->status === PolicyAiImport::STATUS_PROCESSING) {
            return back()->with('error', 'Ya se encuentra en procesamiento');
        }

        $import->update([
            'status' => PolicyAiImport::STATUS_PROCESSING,
            'error_message' => null,
        ]);

        ProcessPolicyAiImportJob::dispatch($import->id, true);

        return back()->with('success', 'Procesamiento iniciado correctamente');
    }

    private function ownedImport(Request $request, string $id): PolicyAiImport
    {
        $import = PolicyAiImport::query()->findOrFail($id);
        $this->authorizeImport($request, $import);

        return $import;
    }

    private function authorizeImport(Request $request, PolicyAiImport $import): void
    {
        if ((string) $import->agent_id !== (string) $request->user()->agent_id) {
            abort(403);
        }
    }

    /** @param UploadedFile[] $files */
    private function storeImportFiles(PolicyAiImport $import, array $files)
    {
        $disk = MediaDisk::name();
        $storedFiles = collect();

        foreach ($files as $file) {
            $fileId = (string) Str::uuid();
            $extension = $file->guessExtension() ?: $file->extension() ?: 'bin';
            $path = "policy-ai/{$import->agent_id}/{$import->id}/{$fileId}.{$extension}";

            $file->storeAs("policy-ai/{$import->agent_id}/{$import->id}", "{$fileId}.{$extension}", $disk);

            $storedFile = PolicyAiImportFile::query()->create([
                'id' => $fileId,
                'policy_ai_import_id' => $import->id,
                'agent_id' => $import->agent_id,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                'disk' => $disk,
                'path' => $path,
                'size' => $file->getSize(),
            ]);

            $storedFiles->push($storedFile);
        }

        return $storedFiles;
    }

    private function serializeImport(PolicyAiImport $import, bool $full = false): array
    {
        $files = $import->files ?? collect();
        $primaryFile = $files->first();

        return [
            'id' => $import->id,
            'status' => $import->status,
            'created_at' => $import->created_at?->toISOString(),
            'error_message' => $import->error_message,
            'missing_fields' => $import->missing_fields ?? [],
            'ai_data' => $import->ai_data,
            'ai_confidence' => $import->ai_confidence,
            'extracted_text' => $full ? $import->extracted_text : null,
            'files' => $files->map(fn (PolicyAiImportFile $file) => [
                'id' => $file->id,
                'original_filename' => $file->original_filename,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
                'created_at' => $file->created_at?->toISOString(),
                'url' => MediaDisk::temporaryUrl($file->path),
            ])->values(),
            'files_count' => $files->count(),
            'primary_filename' => $primaryFile?->original_filename,
            'client_name' => $import->client?->full_name,
            'client_id' => $import->client_id,
            'took_ms' => $import->took_ms,
        ];
    }
}
