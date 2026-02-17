<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFileRequest;
use App\Models\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'table_id' => ['required', 'string', 'max:80'],
            'related_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json([
            'files' => File::query()
                ->where('table_id', $validated['table_id'])
                ->where('related_id', $validated['related_id'])
                ->latest()
                ->get(),
        ]);
    }

    public function store(StoreFileRequest $request): RedirectResponse
    {
        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store('uploads/files', 'public');

        File::query()->create([
            'disk' => 'public',
            'path' => $path,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getClientMimeType(),
            'size' => $uploadedFile->getSize(),
            'table_id' => $request->string('table_id')->toString(),
            'related_id' => $request->integer('related_id'),
        ]);

        return back()->with('success', 'Archivo subido correctamente.');
    }

    public function destroy(Request $request, File $file): RedirectResponse
    {
        $validated = $request->validate([
            'table_id' => ['required', 'string', 'max:80'],
            'related_id' => ['required', 'integer', 'min:1'],
        ]);

        abort_unless(
            $file->table_id === $validated['table_id'] && $file->related_id === $validated['related_id'],
            403,
            'No autorizado para eliminar este archivo.',
        );

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return back()->with('success', 'Archivo eliminado correctamente.');
    }
}
