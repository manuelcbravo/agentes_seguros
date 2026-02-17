import { router } from '@inertiajs/react';
import {
    Download,
    File,
    FileArchive,
    FileAudio,
    FileCode2,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
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

type StoredFile = {
    id: number;
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
    relatedId?: number | null;
    onUpload?: (files: File[]) => void;
    onDeleteStoredFile?: (fileId: number) => void;
    onDownloadStoredFile?: (file: StoredFile) => void;
    accept?: string;
    maxSizeHint?: string;
    uploading?: boolean;
};

const isImageMime = (mimeType: string | null) => mimeType?.startsWith('image/') ?? false;

const resolveFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.startsWith('video/')) return FileVideo;
    if (mimeType.startsWith('audio/')) return FileAudio;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return FileArchive;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('xml')) return FileCode2;

    return File;
};

export function FilePickerDialog({
    open,
    onOpenChange,
    title = 'Subir archivo',
    description = 'Arrastra y suelta archivos para subirlos de inmediato.',
    storedFiles = [],
    tableId,
    relatedId = null,
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

    const uploadWithContext = async (files: File[]) => {
        if (!tableId || !relatedId) return;

        setIsUploadingLocal(true);

        for (const file of files) {
            const uploadForm = new FormData();
            uploadForm.append('file', file);
            uploadForm.append('table_id', tableId);
            uploadForm.append('related_id', String(relatedId));

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
        }

        setIsUploadingLocal(false);
        toast.success('Archivos subidos al repositorio.');
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

    const isUploading = uploading || isUploadingLocal;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
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
                            Se muestran únicamente los archivos del contexto actual. Clic derecho para descargar o eliminar.
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
                                                        <div className="p-2 text-[11px]">
                                                            <p className="truncate font-medium">{file.original_name}</p>
                                                            <p className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                                        </div>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-44">
                                                    <ContextMenuItem onClick={() => onDownloadStoredFile?.(file)}>
                                                        <Download className="size-4" /> Descargar
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
