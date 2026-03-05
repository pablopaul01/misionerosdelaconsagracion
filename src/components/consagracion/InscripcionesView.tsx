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
import { useInscripcionesConsagracion, useConvertirAMisionero } from '@/lib/queries/consagracion';
import { ESTADO_CIVIL_LABEL } from '@/lib/constants/consagracion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const TIPO_LABEL: Record<string, string> = {
  primera_vez: 'Primera vez',
  renovacion:  'Renovación',
};

interface InscripcionesViewProps {
  formacionId: string;
}

export const InscripcionesView = ({ formacionId }: InscripcionesViewProps) => {
  const { data: inscripciones = [], isLoading } = useInscripcionesConsagracion(formacionId);
  const { mutateAsync: convertir, isPending: convirtiendo } = useConvertirAMisionero(formacionId);
  const [globalFilter, setGlobalFilter] = useState('');
  const [confirmando, setConfirmando] = useState<Inscripcion | null>(null);
  const [convertidos, setConvertidos] = useState<Set<string>>(new Set());
  const [errorConversion, setErrorConversion] = useState('');

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

        if (esRenovacion) {
          return <span className="text-xs text-brand-brown/50 italic">Ya es misionero</span>;
        }

        return (
          <Button
            size="sm"
            variant="outline"
            disabled={yaConvertido}
            className={yaConvertido
              ? 'text-brand-teal border-brand-teal opacity-60 cursor-default'
              : 'text-brand-teal border-brand-teal hover:bg-brand-teal/10'}
            onClick={() => !yaConvertido && setConfirmando(ins)}
          >
            {yaConvertido ? 'Ya es misionero' : '+ Misionero'}
          </Button>
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
      <Input
        placeholder="Buscar por apellido, nombre..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

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
                {esRenovacion ? (
                  <span className="text-xs text-brand-brown/50 italic shrink-0">Ya es misionero</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={yaConvertido}
                    className={`shrink-0 text-xs ${yaConvertido
                      ? 'text-brand-teal border-brand-teal opacity-60 cursor-default'
                      : 'text-brand-teal border-brand-teal hover:bg-brand-teal/10'}`}
                    onClick={() => !yaConvertido && setConfirmando(ins)}
                  >
                    {yaConvertido ? 'Misionero ✓' : '+ Misionero'}
                  </Button>
                )}
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
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-brown">
          {table.getFilteredRowModel().rows.length} inscripto(s)
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      </div>

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
    </div>
  );
};
