import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    FilePlus2,
    Filter,
    Loader2,
    MoreHorizontal,
    RefreshCcw,
    Sparkles,
    Upload,
    UploadCloud,
    NotebookPen,
    FolderSearch
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type ClientOption = {
    id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    rfc?: string | null;
};

type ClientSearchResult = {
    id: string;
    full_name: string;
    subtitle?: string;
    email?: string | null;
    phone?: string | null;
    rfc?: string | null;
};

type FileDropzoneProps = {
    id: string;
    files: File[];
    onFilesSelected: (files: File[]) => void;
    helperText: string;
};

function FileDropzone({
    id,
    files,
    onFilesSelected,
    helperText,
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileList = (fileList: FileList | null) => {
        const selected = Array.from(fileList ?? []);
        onFilesSelected(selected.slice(0, 5));
    };

    return (
        <div className="space-y-2">
            <input
                ref={inputRef}
                id={id}
                type="file"
                className="hidden"
                accept="application/pdf,image/png,image/jpeg"
                multiple
                onChange={(event) => handleFileList(event.target.files)}
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
                    handleFileList(event.dataTransfer.files);
                }}
                className={`flex h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition ${
                    isDragging
                        ? 'border-primary bg-primary/10'
                        : 'border-primary/30 bg-muted/30 hover:border-primary/60 hover:bg-muted'
                }`}
            >
                <div className="space-y-1">
                    <UploadCloud className="mx-auto size-8 text-primary" />
                    <div>
                        <p className="font-medium">
                            Arrastra y suelta o haz clic para seleccionar
                            archivos
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {helperText}
                        </p>
                    </div>
                </div>
            </button>

            {files.length > 0 && (
                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                    {files.map((file) => (
                        <p key={`${file.name}-${file.size}`}>- {file.name}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

type ImportRow = {
    id: string;
    status: 'uploaded' | 'processing' | 'ready' | 'needs_review' | 'failed';
    created_at: string;
    missing_fields: string[];
    error_message?: string | null;
    files_count: number;
    primary_filename: string | null;
    client_name?: string | null;
};

type ClientsSearchApiItem = {
    id: string;
    label: string;
    subtitle?: string;
    email?: string | null;
    phone?: string | null;
    rfc?: string | null;
};

type PolicyAiIndexProps = {
    imports: { data: ImportRow[] };
    clients: ClientOption[];
};

export default function PolicyAiIndex({
    imports,
    clients,
}: PolicyAiIndexProps) {
    const [search, setSearch] = useState('');
    const [contractorSearch, setContractorSearch] = useState('');
    const [contractorDebouncedSearch, setContractorDebouncedSearch] =
        useState('');
    const [contractorOpen, setContractorOpen] = useState(false);
    const [contractorLoading, setContractorLoading] = useState(false);
    const [contractorResults, setContractorResults] = useState<
        ClientSearchResult[]
    >([]);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [appendDialogOpen, setAppendDialogOpen] = useState(false);
    const [selectedImport, setSelectedImport] = useState<ImportRow | null>(
        null,
    );
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [appendFiles, setAppendFiles] = useState<File[]>([]);
    const { flash, errors } = usePage<
        SharedData & { errors?: Record<string, string> }
    >().props;

    const createForm = useForm({ client_id: '', files: [] as File[] });
    const appendForm = useForm({ files: [] as File[] });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.error, flash?.success]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setContractorDebouncedSearch(contractorSearch.trim());
        }, 300);

        return () => window.clearTimeout(timer);
    }, [contractorSearch]);

    useEffect(() => {
        let cancelled = false;

        if (contractorDebouncedSearch.length < 3 || !uploadDialogOpen) {
            setContractorResults([]);
            setContractorLoading(false);
            setContractorOpen(false);
            return;
        }

        const searchContractors = async () => {
            setContractorLoading(true);
            setContractorOpen(true);

            try {
                const response = await fetch(
                    `${route('clients.search')}?query=${encodeURIComponent(contractorDebouncedSearch)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok || cancelled) return;

                const data = (await response.json()) as ClientsSearchApiItem[];
                if (cancelled) return;

                setContractorResults(
                    data.map((item) => ({
                        id: item.id,
                        full_name: item.label,
                        subtitle: item.subtitle,
                        email: item.email,
                        phone: item.phone,
                        rfc: item.rfc,
                    })),
                );
            } finally {
                if (!cancelled) setContractorLoading(false);
            }
        };

        void searchContractors();

        return () => {
            cancelled = true;
        };
    }, [contractorDebouncedSearch, uploadDialogOpen]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Pólizas', href: route('polizas.index') },
            { title: 'Pólizas IA', href: route('polizas.ai.index') },
        ],
        [],
    );

    const statusBadge = (status: ImportRow['status']) => {
        if (status === 'ready') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-700">
                    Listo
                </Badge>
            );
        }

        if (status === 'needs_review') {
            return (
                <Badge className="bg-amber-500/10 text-amber-700">
                    Revisión
                </Badge>
            );
        }

        if (status === 'failed') {
            return <Badge variant="destructive">Error</Badge>;
        }

        if (status === 'processing') {
            return (
                <Badge className="bg-blue-500/10 text-blue-700">
                    Procesando
                </Badge>
            );
        }

        return <Badge variant="secondary">Subido</Badge>;
    };

    const rows = imports.data.filter((item) => {
        if (!search.trim()) {
            return true;
        }

        return `${item.primary_filename ?? ''} ${item.client_name ?? ''} ${item.id}`
            .toLowerCase()
            .includes(search.trim().toLowerCase());
    });

    const columns: DataTableColumn<ImportRow>[] = [
        {
            key: 'client_name',
            header: 'Contratante',
            cell: (row) => row.client_name ?? '—',
        },
        {
            key: 'archivo',
            header: 'Archivo',
            cell: (row) => {
                const extraFiles = Math.max((row.files_count ?? 1) - 1, 0);
                return (
                    <div className="space-y-1">
                        <p className="font-medium">
                            {row.primary_filename ?? 'Sin archivo'}
                        </p>
                        {extraFiles > 0 && (
                            <p className="text-xs text-muted-foreground">
                                +{extraFiles}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'files_count',
            header: 'Archivos',
            cell: (row) => <Badge variant="secondary">{row.files_count}</Badge>,
        },
        {
            key: 'created_at',
            header: 'Fecha',
            cell: (row) =>
                new Date(row.created_at).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }),
        },
        {
            key: 'status',
            header: 'Estado',
            cell: (row) => statusBadge(row.status),
        },
        {
            key: 'observaciones',
            header: 'Observaciones',
            cell: (row) => {
                if (row.status === 'needs_review') {
                    return (
                        <span className="text-xs text-amber-700">
                            Revisión requerida
                        </span>
                    );
                }

                if (row.status === 'failed') {
                    return (
                        <span className="text-xs text-destructive">
                            Error al procesar
                        </span>
                    );
                }

                return <span className="text-xs text-muted-foreground">—</span>;
            },
        },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() =>
                                router.visit(route('polizas.ai.show', row.id))
                            }
                        >
                            <FolderSearch className="mr-2 size-4" /> Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setSelectedImport(row);
                                setAppendFiles([]);
                                appendForm.reset('files');
                                setAppendDialogOpen(true);
                            }}
                        >
                            <FilePlus2 className="mr-2 size-4" /> Agregar
                            archivos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={
                                !['ready', 'needs_review'].includes(row.status)
                            }
                            onClick={() =>
                                router.post(route('polizas.ai.convert', row.id))
                            }
                        >
                            <NotebookPen className="mr-2 size-4" /> Convertir a póliza
                        </DropdownMenuItem>
                        {['failed', 'needs_review'].includes(row.status) && (
                            <DropdownMenuItem
                                onClick={() =>
                                    router.post(
                                        route('polizas.ai.retry', row.id),
                                    )
                                }
                            >
                                <RefreshCcw className="mr-2 size-4" />{' '}
                                Reintentar
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const selectedClientName = useMemo(() => {
        const selectedFromResults = contractorResults.find(
            (item) => item.id === createForm.data.client_id,
        );
        if (selectedFromResults) return selectedFromResults.full_name;

        return clients.find((item) => item.id === createForm.data.client_id)
            ?.full_name;
    }, [clients, contractorResults, createForm.data.client_id]);

    const validateFileSelection = (files: File[]) => {
        if (files.length === 0) {
            toast.error('Selecciona al menos un archivo.');
            return false;
        }

        if (files.length > 5) {
            toast.error(
                'Solo puedes subir hasta 5 archivos por registro de Póliza IA.',
            );
            return false;
        }

        return true;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pólizas IA" />
            <div className="space-y-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Sparkles className="size-5 text-primary" />
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">
                                    Pólizas IA
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Carga archivos para lectura y conversión a
                                    póliza.
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setUploadDialogOpen(true)}>
                            <Upload className="mr-2 size-4" /> Cargar archivo(s)
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por contratante, archivo o id..."
                        />
                        <div className="md:col-span-2">
                            <Button variant="outline" disabled>
                                <Filter className="mr-2 size-4" /> Filtros
                                homologados
                            </Button>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={rows}
                    emptyMessage="No hay importaciones de IA registradas."
                />
            </div>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Cargar archivo(s)</DialogTitle>
                        <DialogDescription>
                            Busca el contratante y adjunta hasta 5 archivos para
                            un solo registro de Póliza IA.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Buscar contratante</Label>
                            <Combobox
                                value={createForm.data.client_id}
                                open={
                                    contractorOpen &&
                                    contractorDebouncedSearch.length >= 3
                                }
                                onOpenChange={setContractorOpen}
                                onValueChange={(value) =>
                                    createForm.setData('client_id', value ?? '')
                                }
                            >
                                <ComboboxInput
                                    placeholder="Buscar cliente (mínimo 3 caracteres)..."
                                    value={contractorSearch}
                                    onChange={(event) =>
                                        setContractorSearch(event.target.value)
                                    }
                                    className="w-full"
                                />
                                {contractorDebouncedSearch.length >= 3 && (
                                    <ComboboxContent className="z-[9999] pointer-events-auto">
                                        <ComboboxList>
                                            {contractorLoading && (
                                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Buscando clientes...
                                                </div>
                                            )}
                                            {!contractorLoading &&
                                                contractorResults.length ===
                                                    0 && (
                                                    <ComboboxEmpty>
                                                        Sin resultados.
                                                    </ComboboxEmpty>
                                                )}
                                            {contractorResults.map((client) => (
                                                <ComboboxItem
                                                    key={client.id}
                                                    value={client.id}
                                                    onSelect={() => {
                                                        createForm.setData(
                                                            'client_id',
                                                            client.id,
                                                        );
                                                        setContractorSearch(
                                                            client.full_name,
                                                        );
                                                        setContractorOpen(
                                                            false,
                                                        );
                                                    }}
                                                >
                                                    <div className="flex w-full items-center justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium">
                                                                {
                                                                    client.full_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {[
                                                                    client.rfc,
                                                                    client.email,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        ' · ',
                                                                    ) ||
                                                                    client.subtitle ||
                                                                    client.phone ||
                                                                    'Sin datos adicionales'}
                                                            </p>
                                                        </div>
                                                        {createForm.data
                                                            .client_id ===
                                                            client.id && (
                                                            <Check className="size-4" />
                                                        )}
                                                    </div>
                                                </ComboboxItem>
                                            ))}
                                        </ComboboxList>
                                    </ComboboxContent>
                                )}
                            </Combobox>
                            {createForm.data.client_id &&
                                selectedClientName && (
                                    <p className="text-xs text-muted-foreground">
                                        Contratante seleccionado:{' '}
                                        <span className="font-medium text-foreground">
                                            {selectedClientName}
                                        </span>
                                    </p>
                                )}
                            {(errors?.client_id ||
                                createForm.errors.client_id) && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.client_id ??
                                        errors?.client_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="policy-ai-files">
                                Subir archivos (máximo 5)
                            </Label>
                            <FileDropzone
                                id="policy-ai-files"
                                files={uploadFiles}
                                onFilesSelected={setUploadFiles}
                                helperText="Formatos permitidos: PDF, JPG y PNG · máximo 20MB por archivo."
                            />
                            {(errors?.files || createForm.errors.files) && (
                                <p className="text-xs text-destructive">
                                    {createForm.errors.files ?? errors?.files}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUploadDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            disabled={createForm.processing}
                            onClick={() => {
                                if (!createForm.data.client_id) {
                                    toast.error('Selecciona un contratante.');
                                    return;
                                }
                                if (!validateFileSelection(uploadFiles)) return;

                                createForm.setData('files', uploadFiles);
                                createForm.post(route('polizas.ai.store'), {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setUploadDialogOpen(false);
                                        setUploadFiles([]);
                                        setContractorSearch('');
                                        setContractorResults([]);
                                        createForm.reset('client_id', 'files');
                                    },
                                });
                            }}
                        >
                            {createForm.processing
                                ? 'Cargando...'
                                : 'Cargar archivo(s)'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={appendDialogOpen}
                onOpenChange={(open) => {
                    setAppendDialogOpen(open);
                    if (!open) {
                        setSelectedImport(null);
                        setAppendFiles([]);
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Agregar archivos</DialogTitle>
                        <DialogDescription>
                            Adjunta archivos adicionales para reprocesar este
                            registro (tope 5 archivos totales).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="policy-ai-append-files">
                            Archivos a agregar
                        </Label>
                        <FileDropzone
                            id="policy-ai-append-files"
                            files={appendFiles}
                            onFilesSelected={setAppendFiles}
                            helperText="Puedes agregar hasta completar 5 archivos por registro de Póliza IA."
                        />
                        <p className="text-xs text-muted-foreground">
                            El registro ya tiene{' '}
                            {selectedImport?.files_count ?? 0} archivo(s).
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAppendDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            disabled={appendForm.processing}
                            onClick={() => {
                                if (!selectedImport) return;
                                if (!validateFileSelection(appendFiles)) return;

                                const total =
                                    (selectedImport.files_count ?? 0) +
                                    appendFiles.length;
                                if (total > 5) {
                                    toast.error(
                                        'No puedes exceder 5 archivos por registro de Póliza IA.',
                                    );
                                    return;
                                }

                                appendForm.setData('files', appendFiles);
                                appendForm.post(
                                    route(
                                        'polizas.ai.files.store',
                                        selectedImport.id,
                                    ),
                                    {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setAppendDialogOpen(false);
                                            setSelectedImport(null);
                                            setAppendFiles([]);
                                            appendForm.reset('files');
                                        },
                                    },
                                );
                            }}
                        >
                            {appendForm.processing
                                ? 'Agregando...'
                                : 'Agregar archivos'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
