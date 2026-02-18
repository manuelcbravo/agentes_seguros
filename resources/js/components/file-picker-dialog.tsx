import { router } from '@inertiajs/react';
import {
    Download,
    File as FileIcon,
    FileArchive,
    FileAudio,
    FileCode2,
    FileImage,
    FilePenLine,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Loader2,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/Components/ui/progress';

type StoredFile = {
    id: number;
    uuid: string;
    original_name: string;
    path: string;
    url: string;
    mime_type: string | null;
    size: number;
};

type FilePickerDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    storedFiles?: StoredFile[];
    tableId?: string;
    relatedUuid?: string | null;
    onUpload?: (files: File[]) => void;
    onDeleteStoredFile?: (fileId: number) => void;
    onDownloadStoredFile?: (file: StoredFile) => void;
    accept?: string;
    maxSizeHint?: string;
    uploading?: boolean;
};

const isImageMime = (mimeType: string | null) => mimeType?.startsWith('image/') ?? false;

const resolveFileIcon = (mimeType: string | null) => {
    if (!mimeType) return FileIcon;
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.startsWith('video/')) return FileVideo;
    if (mimeType.startsWith('audio/')) return FileAudio;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return FileArchive;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('xml')) return FileCode2;

    return FileIcon;
};

export function FilePickerDialog({
    open,
    onOpenChange,
    title = 'Subir archivo',
    description = 'Arrastra y suelta archivos para subirlos de inmediato.',
    storedFiles = [],
    tableId,
    relatedUuid = null,
    onUpload,
    onDeleteStoredFile,
    onDownloadStoredFile,
    accept = '*/*',
    maxSizeHint = 'Máximo 10MB',
    uploading = false,
}: FilePickerDialogProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploadingLocal, setIsUploadingLocal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [renamingFileId, setRenamingFileId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const uploadWithContext = async (files: File[]) => {
        if (!tableId || !relatedUuid) return;

        setIsUploadingLocal(true);
        setProgress(0);

        for (const [index, file] of files.entries()) {
            const uploadForm = new FormData();
            uploadForm.append('file', file);
            uploadForm.append('related_table', tableId);
            uploadForm.append('related_uuid', relatedUuid);

            await new Promise<void>((resolve, reject) => {
                router.post(route('files.store'), uploadForm, {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(new Error('upload_failed')),
                });
            }).catch(() => {
                toast.error(`No se pudo subir: ${file.name}`);
            });

            setProgress(Math.round(((index + 1) / files.length) * 100));
        }

        setIsUploadingLocal(false);
        setProgress(0);
    };

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const selectedFiles = Array.from(files);
        if (onUpload) {
            onUpload(selectedFiles);
            return;
        }

        void uploadWithContext(selectedFiles);
    };

    const startRenaming = (file: StoredFile) => {
        setRenamingFileId(file.id);
        setRenameValue(file.original_name);
    };

    const submitRename = (file: StoredFile) => {
        if (!tableId || !relatedUuid) return;

        const newName = renameValue.trim();
        if (!newName) {
            toast.error('El nombre no puede estar vacío.');
            return;
        }

        router.patch(route('files.rename', file.uuid), {
            related_table: tableId,
            related_uuid: relatedUuid,
            original_name: newName,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRenamingFileId(null);
                setRenameValue('');
            },
            onError: () => toast.error('No se pudo renombrar el archivo.'),
        });
    };

    const isUploading = uploading || isUploadingLocal;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="relative space-y-4">
                    {isUploading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/85 backdrop-blur-sm">
                            <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-2xl">
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <Loader2 className="size-5 animate-spin text-primary" />
                                    Cargando archivos...
                                </div>
                                <Progress value={progress || 20} className="h-2" />
                                <p className="text-xs text-muted-foreground">Por favor espera mientras completamos la carga.</p>
                            </div>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            handleFiles(event.target.files);
                            event.target.value = '';
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(event) => {
                            event.preventDefault();
                            setIsDragging(false);
                            handleFiles(event.dataTransfer.files);
                        }}
                        className={`flex h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition ${
                            isDragging
                                ? 'border-primary bg-primary/10'
                                : 'border-primary/30 bg-muted/30 hover:border-primary/60 hover:bg-muted'
                        }`}
                        disabled={isUploading}
                    >
                        <UploadCloud className="size-8 text-primary" />
                        <div>
                            <p className="font-medium">Arrastra y suelta o haz clic para seleccionar archivos</p>
                            <p className="text-xs text-muted-foreground">
                                {isUploading ? 'Subiendo archivos...' : `Subida automática · ${maxSizeHint}`}
                            </p>
                        </div>
                    </button>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Archivos cargados</p>
                        <p className="text-xs text-muted-foreground">
                            Se muestran únicamente los archivos del contexto actual. Clic derecho para descargar, renombrar o eliminar.
                        </p>
                        <div className="max-h-[430px] overflow-y-auto rounded-lg border p-2">
                            {storedFiles.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">Aún no hay archivos subidos.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                    {storedFiles.map((file) => {
                                        const Icon = resolveFileIcon(file.mime_type);

                                        return (
                                            <ContextMenu key={file.id}>
                                                <ContextMenuTrigger asChild>
                                                    <div className="group relative overflow-hidden rounded-md border border-border">
                                                        {isImageMime(file.mime_type) ? (
                                                            <img src={file.url} alt={file.original_name} className="h-28 w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-28 w-full items-center justify-center bg-muted/30">
                                                                <Icon className="size-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="space-y-1 p-2 text-[11px]">
                                                            {renamingFileId === file.id ? (
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        value={renameValue}
                                                                        onChange={(event) => setRenameValue(event.target.value)}
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === 'Enter') {
                                                                                event.preventDefault();
                                                                                submitRename(file);
                                                                            }
                                                                            if (event.key === 'Escape') {
                                                                                setRenamingFileId(null);
                                                                                setRenameValue('');
                                                                            }
                                                                        }}
                                                                        className="h-7 text-[11px]"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            type="button"
                                                                            className="rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground"
                                                                            onClick={() => submitRename(file)}
                                                                        >
                                                                            Guardar
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="rounded border px-2 py-1 text-[10px]"
                                                                            onClick={() => {
                                                                                setRenamingFileId(null);
                                                                                setRenameValue('');
                                                                            }}
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="truncate font-medium">{file.original_name}</p>
                                                                    <p className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-44">
                                                    <ContextMenuItem onClick={() => onDownloadStoredFile?.(file)}>
                                                        <Download className="size-4" /> Descargar
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => startRenaming(file)}>
                                                        <FilePenLine className="size-4" /> Renombrar
                                                    </ContextMenuItem>
                                                    {onDeleteStoredFile && (
                                                        <ContextMenuItem
                                                            variant="destructive"
                                                            onClick={() => onDeleteStoredFile(file.id)}
                                                        >
                                                            <Trash2 className="size-4" /> Eliminar
                                                        </ContextMenuItem>
                                                    )}
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
