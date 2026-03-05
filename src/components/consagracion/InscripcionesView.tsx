'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  useInscripcionesConsagracion,
  useConvertirAMisionero,
  useCreateInscripcionConsagracion,
  useUpdateInscripcionConsagracion,
  useDeleteInscripcionConsagracion,
} from '@/lib/queries/consagracion';
import { ESTADO_CIVIL_LABEL, ESTADO_CIVIL } from '@/lib/constants/consagracion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/types/supabase';
import type { InscripcionConsagracionInput } from '@/lib/validations/consagracion';

type Inscripcion = Database['public']['Tables']['inscripciones_consagracion']['Row'] & {
  dni?: string;
  tipo_inscripcion?: string;
};

const SACRAMENTOS_LABEL: Record<string, string> = {
  bautismo:     'Bautismo',
  comunion:     'Comunión',
  confirmacion: 'Confirmación',
  matrimonio:   'Matrimonio',
};

const SACRAMENTOS_OPTIONS = [
  { value: 'bautismo',     label: 'Bautismo' },
  { value: 'comunion',     label: 'Comunión' },
  { value: 'confirmacion', label: 'Confirmación' },
  { value: 'matrimonio',   label: 'Matrimonio' },
];

const TIPO_LABEL: Record<string, string> = {
  primera_vez: 'Primera vez',
  renovacion:  'Renovación',
};

// ── Form values type ──────────────────────────────────────────────

type FormValues = {
  nombre: string;
  apellido: string;
  dni: string;
  domicilio: string;
  whatsapp: string;
  estado_civil: string;
  tipo_inscripcion: string;
  sacramentos: string[];
  comentario: string;
};

const EMPTY_FORM: FormValues = {
  nombre: '', apellido: '', dni: '', domicilio: '', whatsapp: '',
  estado_civil: '', tipo_inscripcion: '', sacramentos: [], comentario: '',
};

const inscripcionToForm = (ins: Inscripcion): FormValues => ({
  nombre:           ins.nombre,
  apellido:         ins.apellido,
  dni:              ins.dni ?? '',
  domicilio:        ins.domicilio ?? '',
  whatsapp:         ins.whatsapp ?? '',
  estado_civil:     ins.estado_civil ?? '',
  tipo_inscripcion: ins.tipo_inscripcion ?? '',
  sacramentos:      (ins.sacramentos as string[]) ?? [],
  comentario:       ins.comentario ?? '',
});

// ── Dialog form ───────────────────────────────────────────────────

interface InscripcionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formacionId: string;
  inscripcion: Inscripcion | null; // null = crear
}

const InscripcionDialog = ({ open, onOpenChange, formacionId, inscripcion }: InscripcionDialogProps) => {
  const { mutateAsync: crear, isPending: creando } = useCreateInscripcionConsagracion(formacionId);
  const { mutateAsync: actualizar, isPending: actualizando } = useUpdateInscripcionConsagracion(formacionId);

  const [form, setForm] = useState<FormValues>(() =>
    inscripcion ? inscripcionToForm(inscripcion) : EMPTY_FORM
  );
  const [error, setError] = useState('');

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(inscripcion ? inscripcionToForm(inscripcion) : EMPTY_FORM);
    setError('');
    onOpenChange(v);
  };

  const set = (key: keyof FormValues, value: FormValues[keyof FormValues]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSacramento = (value: string) =>
    setForm((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(value)
        ? prev.sacramentos.filter((s) => s !== value)
        : [...prev.sacramentos, value],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.apellido || !form.dni || !form.whatsapp || !form.estado_civil || !form.tipo_inscripcion) {
      setError('Completá los campos obligatorios (*)');
      return;
    }

    const input: InscripcionConsagracionInput = {
      nombre:           form.nombre.trim(),
      apellido:         form.apellido.trim(),
      dni:              form.dni.trim(),
      domicilio:        form.domicilio.trim(),
      whatsapp:         form.whatsapp.trim(),
      estado_civil:     form.estado_civil as InscripcionConsagracionInput['estado_civil'],
      tipo_inscripcion: form.tipo_inscripcion as InscripcionConsagracionInput['tipo_inscripcion'],
      sacramentos:      form.sacramentos,
      comentario:       form.comentario.trim(),
    };

    try {
      if (inscripcion) {
        await actualizar({ id: inscripcion.id, input });
      } else {
        await crear(input);
      }
      onOpenChange(false);
    } catch (e) {
      setError((e as Error)?.message ?? 'Error al guardar');
    }
  };

  const isPending = creando || actualizando;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-title text-brand-dark">
            {inscripcion ? 'Editar inscripto' : 'Nueva inscripción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Apellido *</Label>
              <Input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>DNI *</Label>
              <Input value={form.dni} onChange={(e) => set('dni', e.target.value)} inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>WhatsApp *</Label>
              <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Domicilio</Label>
            <Input value={form.domicilio} onChange={(e) => set('domicilio', e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado civil *</Label>
            <Select value={form.estado_civil} onValueChange={(v) => set('estado_civil', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {Object.values(ESTADO_CIVIL).map((v) => (
                  <SelectItem key={v} value={v}>{ESTADO_CIVIL_LABEL[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de inscripción *</Label>
            <div className="flex gap-4">
              {[
                { value: 'primera_vez', label: 'Primera vez' },
                { value: 'renovacion',  label: 'Renovación' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="tipo_inscripcion"
                    value={opt.value}
                    checked={form.tipo_inscripcion === opt.value}
                    onChange={() => set('tipo_inscripcion', opt.value)}
                    className="accent-brand-teal"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Sacramentos recibidos</Label>
            <div className="grid grid-cols-2 gap-2">
              {SACRAMENTOS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={form.sacramentos.includes(opt.value)}
                    onCheckedChange={() => toggleSacramento(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Comentario</Label>
            <Textarea
              value={form.comentario}
              onChange={(e) => set('comentario', e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-brown hover:bg-brand-dark text-white"
            >
              {isPending ? 'Guardando...' : inscripcion ? 'Guardar cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Main component ────────────────────────────────────────────────

interface InscripcionesViewProps {
  formacionId: string;
}

export const InscripcionesView = ({ formacionId }: InscripcionesViewProps) => {
  const { data: inscripciones = [], isLoading } = useInscripcionesConsagracion(formacionId);
  const { mutateAsync: convertir, isPending: convirtiendo } = useConvertirAMisionero(formacionId);
  const { mutateAsync: eliminar } = useDeleteInscripcionConsagracion(formacionId);

  const [globalFilter, setGlobalFilter] = useState('');
  const [confirmando, setConfirmando] = useState<Inscripcion | null>(null);
  const [convertidos, setConvertidos] = useState<Set<string>>(new Set());
  const [errorConversion, setErrorConversion] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Inscripcion | null>(null);

  const [eliminando, setEliminando] = useState<Inscripcion | null>(null);
  const [errorEliminar, setErrorEliminar] = useState('');

  const handleConvertir = async () => {
    if (!confirmando) return;
    setErrorConversion('');
    try {
      await convertir({
        nombre:   confirmando.nombre,
        apellido: confirmando.apellido,
        dni:      confirmando.dni ?? '',
        whatsapp: confirmando.whatsapp ?? '',
      });
      setConvertidos((prev) => new Set(prev).add(confirmando.id));
      setConfirmando(null);
    } catch (e) {
      setErrorConversion((e as Error)?.message ?? 'Error al crear el misionero');
    }
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    setErrorEliminar('');
    try {
      await eliminar(eliminando.id);
      setEliminando(null);
    } catch (e) {
      setErrorEliminar((e as Error)?.message ?? 'Error al eliminar');
    }
  };

  const openCreate = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit   = (ins: Inscripcion) => { setEditTarget(ins); setDialogOpen(true); };

  const COLUMNS: ColumnDef<Inscripcion>[] = [
    { accessorKey: 'apellido', header: 'Apellido' },
    { accessorKey: 'nombre',   header: 'Nombre' },
    { accessorKey: 'dni',      header: 'DNI' },
    { accessorKey: 'whatsapp', header: 'WhatsApp' },
    {
      accessorKey: 'estado_civil',
      header: 'Estado civil',
      cell: ({ row }) => ESTADO_CIVIL_LABEL[row.original.estado_civil] ?? row.original.estado_civil,
    },
    {
      accessorKey: 'tipo_inscripcion',
      header: 'Tipo',
      cell: ({ row }) => TIPO_LABEL[row.original.tipo_inscripcion ?? ''] ?? '—',
    },
    {
      accessorKey: 'sacramentos',
      header: 'Sacramentos',
      cell: ({ row }) => {
        const sacramentos = (row.original.sacramentos as string[]) ?? [];
        return (
          <div className="flex flex-wrap gap-1">
            {sacramentos.map((s) => (
              <Badge key={s} className="bg-brand-creamLight text-brand-dark text-xs">
                {SACRAMENTOS_LABEL[s] ?? s}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'comentario',
      header: 'Comentario',
      cell: ({ row }) => (
        <span className="text-sm text-brand-brown truncate max-w-[160px] block" title={row.original.comentario ?? ''}>
          {row.original.comentario || '—'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const ins = row.original;
        const esRenovacion = ins.tipo_inscripcion === 'renovacion';
        const yaConvertido = convertidos.has(ins.id);

        return (
          <div className="flex items-center gap-1 flex-wrap">
            <Button size="sm" variant="ghost" className="text-brand-brown h-7 px-2 text-xs"
              onClick={() => openEdit(ins)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs"
              onClick={() => { setErrorEliminar(''); setEliminando(ins); }}>
              Eliminar
            </Button>
            {!esRenovacion ? (
              <Button
                size="sm"
                variant="outline"
                disabled={yaConvertido}
                className={yaConvertido
                  ? 'text-brand-teal border-brand-teal opacity-60 cursor-default h-7 px-2 text-xs'
                  : 'text-brand-teal border-brand-teal hover:bg-brand-teal/10 h-7 px-2 text-xs'}
                onClick={() => !yaConvertido && setConfirmando(ins)}
              >
                {yaConvertido ? 'Misionero ✓' : '+ Misionero'}
              </Button>
            ) : (
              <span className="text-xs text-brand-brown/50 italic">Ya es misionero</span>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: inscripciones,
    columns: COLUMNS,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (isLoading) return <p className="text-brand-brown">Cargando inscripciones...</p>;

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por apellido, nombre..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm flex-1"
        />
        <span className="text-sm text-brand-brown shrink-0">
          {table.getFilteredRowModel().rows.length} inscripto(s)
        </span>
        <Button
          onClick={openCreate}
          className="bg-brand-brown hover:bg-brand-dark text-white shrink-0"
        >
          + Nueva inscripción
        </Button>
      </div>

      {/* ── Desktop: tabla ── */}
      <div className="hidden md:block rounded-lg border border-brand-creamLight overflow-x-auto">
        <Table>
          <TableHeader className="bg-brand-creamLight">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="font-title text-brand-dark">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-brand-brown py-8">
                  No hay inscripciones
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-brand-cream/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="text-center text-brand-brown py-6">No hay inscripciones</p>
        )}
        {rows.map((row) => {
          const ins = row.original;
          const esRenovacion = ins.tipo_inscripcion === 'renovacion';
          const yaConvertido = convertidos.has(ins.id);
          const sacramentos = (ins.sacramentos as string[]) ?? [];

          return (
            <div key={ins.id} className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-title text-brand-dark font-semibold">
                    {ins.apellido}, {ins.nombre}
                  </p>
                  <p className="text-xs text-brand-brown">
                    DNI {ins.dni ?? '—'} · WA {ins.whatsapp ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="text-brand-brown h-7 px-2 text-xs"
                    onClick={() => openEdit(ins)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs"
                    onClick={() => { setErrorEliminar(''); setEliminando(ins); }}>
                    ✕
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-brown">
                <span>{ESTADO_CIVIL_LABEL[ins.estado_civil] ?? ins.estado_civil}</span>
                {ins.tipo_inscripcion && <span>{TIPO_LABEL[ins.tipo_inscripcion] ?? ins.tipo_inscripcion}</span>}
              </div>

              {sacramentos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sacramentos.map((s) => (
                    <Badge key={s} className="bg-brand-creamLight text-brand-dark text-xs">
                      {SACRAMENTOS_LABEL[s] ?? s}
                    </Badge>
                  ))}
                </div>
              )}

              {ins.comentario && (
                <p className="text-xs text-brand-brown italic">{ins.comentario}</p>
              )}

              <div className="pt-1">
                {esRenovacion ? (
                  <span className="text-xs text-brand-brown/50 italic">Ya es misionero</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={yaConvertido}
                    className={`text-xs ${yaConvertido
                      ? 'text-brand-teal border-brand-teal opacity-60 cursor-default'
                      : 'text-brand-teal border-brand-teal hover:bg-brand-teal/10'}`}
                    onClick={() => !yaConvertido && setConfirmando(ins)}
                  >
                    {yaConvertido ? 'Misionero ✓' : '+ Misionero'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(table.getCanPreviousPage() || table.getCanNextPage()) && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialog crear / editar */}
      <InscripcionDialog
        key={editTarget?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formacionId={formacionId}
        inscripcion={editTarget}
      />

      {/* AlertDialog convertir a misionero */}
      <AlertDialog
        open={!!confirmando}
        onOpenChange={(open) => { if (!open) { setConfirmando(null); setErrorConversion(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Registrar como misionero?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará el misionero <strong>{confirmando?.apellido}, {confirmando?.nombre}</strong> con
              DNI <strong>{confirmando?.dni}</strong>. Si ya existe un misionero con ese DNI, el registro fallará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorConversion && <p className="text-sm text-red-600 px-1">{errorConversion}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-teal hover:bg-brand-navy text-white"
              onClick={handleConvertir}
              disabled={convirtiendo}
            >
              {convirtiendo ? 'Creando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog eliminar inscripto */}
      <AlertDialog
        open={!!eliminando}
        onOpenChange={(open) => { if (!open) { setEliminando(null); setErrorEliminar(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inscripto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente a <strong>{eliminando?.apellido}, {eliminando?.nombre}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorEliminar && <p className="text-sm text-red-600 px-1">{errorEliminar}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 text-white"
              onClick={handleEliminar}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
