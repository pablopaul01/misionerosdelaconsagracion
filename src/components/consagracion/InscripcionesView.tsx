'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  useDeleteInscripcionConsagracion,
  useMarcarConsagracion,
} from '@/lib/queries/consagracion';
import {
  CONTACTO_ESTADO,
  CONTACTO_ESTADO_LABEL,
  ESTADO_CIVIL_LABEL,
  INSCRIPCION_ESTADO,
  type ContactoEstado,
} from '@/lib/constants/consagracion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

// ── Form values type ──────────────────────────────────────────────


// ── Main component ────────────────────────────────────────────────

interface InscripcionesViewProps {
  formacionId: string;
  anio: number;
  finalizada?: boolean;
  onFinalizar?: () => void;
  finalizando?: boolean;
  fechaConsagracion?: string | null;
}

type FiltroConsagracion = 'todos' | 'contactar' | 'consagrados' | 'no_completo' | 'pendiente';

const FILTRO_LABELS: Record<FiltroConsagracion, string> = {
  todos:        'Todos',
  contactar:    'A contactar',
  consagrados:  'Se consagraron',
  no_completo:  'No completaron',
  pendiente:    'Pendientes',
};

export const InscripcionesView = ({
  formacionId,
  anio,
  finalizada,
  onFinalizar,
  finalizando,
  fechaConsagracion,
}: InscripcionesViewProps) => {
  const router = useRouter();
  const { data: inscripciones = [], isLoading } = useInscripcionesConsagracion(formacionId);
  const { mutateAsync: convertir, isPending: convirtiendo } = useConvertirAMisionero(formacionId);
  const { mutateAsync: eliminar } = useDeleteInscripcionConsagracion(formacionId);
  const { mutate: marcar } = useMarcarConsagracion(formacionId);

  const [globalFilter, setGlobalFilter] = useState('');
  const [filtroConsagracion, setFiltroConsagracion] = useState<FiltroConsagracion>('todos');
  const [confirmando, setConfirmando] = useState<Inscripcion | null>(null);
  const [convertirActivo, setConvertirActivo] = useState(true);
  const [convertidos, setConvertidos] = useState<Set<string>>(new Set());
  const [errorConversion, setErrorConversion] = useState('');

  const [eliminando, setEliminando] = useState<Inscripcion | null>(null);
  const [errorEliminar, setErrorEliminar] = useState('');

  const datosFiltrados = useMemo(() => {
    const all = inscripciones as Inscripcion[];
    if (filtroConsagracion === 'contactar')   return all.filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR);
    if (filtroConsagracion === 'consagrados') return all.filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.INSCRIPTO && i.se_consagro === true);
    if (filtroConsagracion === 'no_completo') return all.filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.INSCRIPTO && i.se_consagro === false);
    if (filtroConsagracion === 'pendiente')   return all.filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.INSCRIPTO && i.se_consagro === null);
    return all;
  }, [inscripciones, filtroConsagracion]);

  const totalConsagrados = (inscripciones as Inscripcion[]).filter((i) => i.se_consagro === true).length;
  const totalContactar   = (inscripciones as Inscripcion[]).filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR).length;
  const totalInscriptos  = (inscripciones as Inscripcion[]).filter((i) => i.estado_inscripcion === INSCRIPCION_ESTADO.INSCRIPTO).length;

  const handleConvertir = async () => {
    if (!confirmando) return;
    setErrorConversion('');
    try {
      await convertir({
        nombre:   confirmando.nombre,
        apellido: confirmando.apellido,
        dni:      confirmando.dni ?? '',
        whatsapp: confirmando.whatsapp ?? '',
        activo:   convertirActivo,
        fechaConsagracion,
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

  const openCreate = () => router.push(`/admin/consagracion/${anio}/inscripciones/nuevo`);
  const openEdit = (ins: Inscripcion, mode?: 'contactar' | 'inscripto') => {
    const modeQuery = mode ? `?modo=${mode}` : '';
    router.push(`/admin/consagracion/${anio}/inscripciones/${ins.id}${modeQuery}`);
  };

  const contactoBadgeClass = (estadoContacto: ContactoEstado) => {
    if (estadoContacto === CONTACTO_ESTADO.CONTACTADO_SI) return 'bg-green-100 text-green-800';
    if (estadoContacto === CONTACTO_ESTADO.CONTACTADO_NO) return 'bg-red-100 text-red-700';
    if (estadoContacto === CONTACTO_ESTADO.CONTACTADO) return 'bg-brand-creamLight text-brand-dark';
    return 'bg-brand-gold text-brand-dark';
  };

  const COLUMNS: ColumnDef<Inscripcion>[] = [
    {
      accessorKey: 'apellido',
      header: 'Apellido',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.apellido}</span>
          {row.original.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR && (
            <Badge className="bg-brand-gold text-brand-dark text-xs py-0 px-1.5">A contactar</Badge>
          )}
        </div>
      ),
    },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'dni',      header: 'DNI' },
    { accessorKey: 'whatsapp', header: 'WhatsApp' },
    {
      accessorKey: 'estado_contacto',
      header: 'Estado contacto',
      cell: ({ row }) => {
        const estado = (row.original.estado_contacto ?? CONTACTO_ESTADO.PENDIENTE) as ContactoEstado;
        return (
          <Badge className={`text-xs py-0 px-1.5 ${contactoBadgeClass(estado)}`}>
            {CONTACTO_ESTADO_LABEL[estado]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'estado_civil',
      header: 'Estado civil',
      cell: ({ row }) => row.original.estado_civil ? (ESTADO_CIVIL_LABEL[row.original.estado_civil] ?? row.original.estado_civil) : '—',
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
      accessorKey: 'observacion_contacto',
      header: 'Observacion / Comentario',
      cell: ({ row }) => (
        <span
          className="text-sm text-brand-brown truncate max-w-[200px] block"
          title={row.original.observacion_contacto ?? row.original.comentario ?? ''}
        >
          {row.original.observacion_contacto ?? row.original.comentario ?? '—'}
        </span>
      ),
    },
    {
      id: 'se_consagro',
      header: 'Consagración',
      cell: ({ row }) => {
        const ins = row.original;
        if (ins.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR) return <span className="text-xs text-brand-brown/40">—</span>;
        return (
          <div className="flex items-center gap-1">
            <button
              title="Se consagró"
              onClick={() => marcar({ id: ins.id, se_consagro: ins.se_consagro === true ? null : true })}
              className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                ins.se_consagro === true
                  ? 'bg-green-600 text-white'
                  : 'bg-transparent text-green-700 border border-green-600 hover:bg-green-50'
              }`}
            >
              ✓
            </button>
            <button
              title="No completó"
              onClick={() => marcar({ id: ins.id, se_consagro: ins.se_consagro === false ? null : false })}
              className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                ins.se_consagro === false
                  ? 'bg-red-500 text-white'
                  : 'bg-transparent text-red-500 border border-red-400 hover:bg-red-50'
              }`}
            >
              ✗
            </button>
          </div>
        );
      },
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const ins = row.original;
        const esContactar   = ins.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR;
        const esRenovacion  = ins.tipo_inscripcion === 'renovacion';
        const yaConvertido  = convertidos.has(ins.id);
        const puedeDerivarInscripto = (ins.estado_contacto ?? CONTACTO_ESTADO.PENDIENTE) === CONTACTO_ESTADO.CONTACTADO_SI;

        return (
          <div className="flex items-center gap-1 flex-wrap">
            <Button size="sm" variant="ghost" className="text-brand-brown h-7 px-2 text-xs"
              onClick={() => openEdit(ins)}>
              Editar
            </Button>
            {esContactar && puedeDerivarInscripto && (
              <Button
                size="sm"
                variant="outline"
                className="text-brand-teal border-brand-teal hover:bg-brand-teal/10 h-7 px-2 text-xs"
                onClick={() => openEdit(ins, 'inscripto')}
              >
                Pasar a inscripto
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2 text-xs"
              onClick={() => { setErrorEliminar(''); setEliminando(ins); }}>
              Eliminar
            </Button>
            {!esContactar && (
              !esRenovacion ? (
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
              )
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: datosFiltrados,
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
      <div className="flex flex-col gap-2">
        {/* Buscador — fila propia para que siempre tenga espacio */}
        <Input
          placeholder="Buscar por apellido, nombre..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full"
        />
        {/* Acciones — ambos botones juntos */}
        <div className="flex items-center gap-2">
          {finalizada ? (
            <Badge className="bg-green-700 text-white px-3 py-1.5 text-xs">FINALIZADA</Badge>
          ) : onFinalizar ? (
            <Button
              variant="outline"
              size="sm"
              className="border-brand-gold text-brand-dark hover:bg-brand-gold/10 shrink-0"
              onClick={onFinalizar}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Finalizar consagración'}
            </Button>
          ) : null}
          <Button
            onClick={openCreate}
            className="bg-brand-brown hover:bg-brand-dark text-white ml-auto shrink-0"
          >
            + Nueva inscripción
          </Button>
        </div>
        {/* Stats */}
        <span className="text-sm text-brand-brown">
          {totalInscriptos} inscripto(s)
          {totalContactar > 0 && (
            <span className="ml-2 text-brand-gold font-medium">· {totalContactar} a contactar</span>
          )}
          {totalConsagrados > 0 && (
            <span className="ml-2 text-green-700 font-medium">· {totalConsagrados} consagrado(s)</span>
          )}
        </span>
      </div>

      {/* Filtro por estado de consagración */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTRO_LABELS) as FiltroConsagracion[]).map((key) => (
          <button
            key={key}
            onClick={() => setFiltroConsagracion(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filtroConsagracion === key
                ? 'bg-brand-brown text-white border-brand-brown'
                : 'bg-white text-brand-brown border-brand-creamLight hover:border-brand-brown'
            }`}
          >
            {FILTRO_LABELS[key]}
          </button>
        ))}
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
          const esContactar   = ins.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR;
          const esRenovacion  = ins.tipo_inscripcion === 'renovacion';
          const yaConvertido  = convertidos.has(ins.id);
          const sacramentos   = (ins.sacramentos as string[]) ?? [];
          const estadoContacto = (ins.estado_contacto ?? CONTACTO_ESTADO.PENDIENTE) as ContactoEstado;
          const puedeDerivarInscripto = estadoContacto === CONTACTO_ESTADO.CONTACTADO_SI;
          const seConsagroLabel = ins.se_consagro === true ? 'Se consagró' : ins.se_consagro === false ? 'No completó' : null;

          return (
            <div key={ins.id} className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-title text-brand-dark font-semibold">
                      {ins.apellido}, {ins.nombre}
                    </p>
                    <Badge className={`text-xs py-0 px-1.5 ${contactoBadgeClass(estadoContacto)}`}>
                      {CONTACTO_ESTADO_LABEL[estadoContacto]}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-brown">
                    {ins.dni ? `DNI ${ins.dni} · ` : ''}WA {ins.whatsapp ?? '—'}
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
                <span>{ins.estado_civil ? (ESTADO_CIVIL_LABEL[ins.estado_civil] ?? ins.estado_civil) : '—'}</span>
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

              {ins.observacion_contacto && (
                <p className="text-xs text-brand-brown italic">{ins.observacion_contacto}</p>
              )}

              {esContactar && puedeDerivarInscripto && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-brand-teal border-brand-teal hover:bg-brand-teal/10"
                    onClick={() => openEdit(ins, 'inscripto')}
                  >
                    Pasar a inscripto
                  </Button>
                </div>
              )}

              {/* Consagración toggle — solo para inscriptos completos */}
              {!esContactar && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-brand-brown">Consagración:</span>
                    <button
                      title="Se consagró"
                      onClick={() => marcar({ id: ins.id, se_consagro: ins.se_consagro === true ? null : true })}
                      className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                        ins.se_consagro === true
                          ? 'bg-green-600 text-white'
                          : 'bg-transparent text-green-700 border border-green-600'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      title="No completó"
                      onClick={() => marcar({ id: ins.id, se_consagro: ins.se_consagro === false ? null : false })}
                      className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                        ins.se_consagro === false
                          ? 'bg-red-500 text-white'
                          : 'bg-transparent text-red-500 border border-red-400'
                      }`}
                    >
                      ✗
                    </button>
                    {seConsagroLabel && (
                      <span className={`text-xs font-medium ${ins.se_consagro ? 'text-green-700' : 'text-red-500'}`}>
                        {seConsagroLabel}
                      </span>
                    )}
                  </div>

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
                        onClick={() => {
                          if (yaConvertido) return;
                          setConvertirActivo(true);
                          setConfirmando(ins);
                        }}
                      >
                        {yaConvertido ? 'Misionero ✓' : '+ Misionero'}
                      </Button>
                    )}
                  </div>
                </>
              )}
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
          <div className="flex items-center gap-3">
            <Checkbox
              checked={convertirActivo}
              onCheckedChange={(checked) => setConvertirActivo(!!checked)}
            />
            <span className="text-sm text-brand-brown">
              {convertirActivo ? 'Crear como activo' : 'Crear como inactivo'}
            </span>
          </div>
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
