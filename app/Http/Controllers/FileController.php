<?php

namespace App\Http\Controllers;

use App\Http\Requests\RenameFileRequest;
use App\Http\Requests\StoreFileRequest;
use App\Models\File;
use App\Support\Filesystem\MediaDisk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'table_id' => ['required', 'string', 'max:80'],
            'related_uuid' => ['required', 'uuid'],
        ]);

        return response()->json([
            'files' => File::query()
                ->where('table_id', $validated['table_id'])
                ->where('related_uuid', $validated['related_uuid'])
                ->latest()
                ->get(),
        ]);
    }

    public function store(StoreFileRequest $request): RedirectResponse
    {
        $uploadedFile = $request->file('file');
        $disk = MediaDisk::name();
        $path = $uploadedFile->store('uploads/files', $disk);

        File::query()->create([
            'disk' => $disk,
            'path' => $path,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getClientMimeType(),
            'size' => $uploadedFile->getSize(),
            'table_id' => $request->string('table_id')->toString(),
            'related_id' => null,
            'related_uuid' => $request->string('related_uuid')->toString(),
        ]);

        return back()->with('success', 'Archivo subido correctamente.');
    }

    public function rename(RenameFileRequest $request, File $file): RedirectResponse
    {
        $validated = $request->validated();

        abort_unless(
            $file->table_id === $validated['table_id'] && $file->related_uuid === $validated['related_uuid'],
            403,
            'No autorizado para renombrar este archivo.',
        );

        $file->update([
            'original_name' => $validated['original_name'],
        ]);

        return back()->with('success', 'Archivo renombrado correctamente.');
    }

    public function destroy(Request $request, File $file): RedirectResponse
    {
        $validated = $request->validate([
            'table_id' => ['required', 'string', 'max:80'],
            'related_uuid' => ['required', 'uuid'],
        ]);

        abort_unless(
            $file->table_id === $validated['table_id'] && $file->related_uuid === $validated['related_uuid'],
            403,
            'No autorizado para eliminar este archivo.',
        );

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return back()->with('success', 'Archivo eliminado correctamente.');
    }
}
