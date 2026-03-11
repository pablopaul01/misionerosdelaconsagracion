'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMisioneros, useMisionerosRolesMap, useDeleteMisionero } from '@/lib/queries/misioneros';
import { useConfiguracion } from '@/lib/queries/configuracion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION,
  MISIONEROS_IMAGEN_VISUALIZACION,
} from '@/lib/constants/configuracion';
import type { Database } from '@/types/supabase';

type Misionero = Database['public']['Tables']['misioneros']['Row'];

const getInitials = (nombre: string, apellido: string) =>
  `${apellido?.[0] ?? ''}${nombre?.[0] ?? ''}`.toUpperCase();

export const MisioneroTable = () => {
  const router = useRouter();
  const { data: misioneros = [], isLoading } = useMisioneros();
  const { data: rolesMap = {} } = useMisionerosRolesMap();
  const { data: configuracion } = useConfiguracion();
  const { mutateAsync: deleteMisionero, isPending: eliminando } = useDeleteMisionero();
  const [globalFilter, setGlobalFilter] = useState('');
  const [eliminarTarget, setEliminarTarget] = useState<Misionero | null>(null);
  const visualizacionImagen = configuracion?.misioneros_imagen_visualizacion
    ?? DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION;
  const isBannerRealView = visualizacionImagen === MISIONEROS_IMAGEN_VISUALIZACION.bannerReal;

  const globalFilterFn = useMemo(() => {
    return (row: { original: Misionero }, _columnId: string, filterValue: string) => {
      const query = filterValue?.toLowerCase().trim();
      if (!query) return true;
      const m = row.original;
      const rolesText = (rolesMap[m.id] ?? []).map((r) => r.nombre).join(' ');
      const hay = [m.nombre, m.apellido, m.dni, m.whatsapp ?? '', rolesText]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    };
  }, [rolesMap]);

  const columns: ColumnDef<Misionero>[] = [
    { accessorKey: 'apellido', header: 'Apellido' },
    { accessorKey: 'nombre',   header: 'Nombre' },
    { accessorKey: 'dni',      header: 'DNI' },
    { accessorKey: 'whatsapp', header: 'WhatsApp' },
  ];

  const table = useReactTable({
    data: misioneros,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn,
    initialState: { pagination: { pageSize: 20 } },
  });

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por apellido, nombre o DNI..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {table.getRowModel().rows.length === 0 && (
          <p className="text-center text-brand-brown py-6 md:col-span-2 xl:col-span-3">No hay misioneros registrados</p>
        )}
        {table.getRowModel().rows.map((row) => {
          const m = row.original;
          return (
            <div key={m.id} className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-col gap-3">
              {isBannerRealView ? (
                <div className="flex flex-col gap-3">
                  <div className="w-full aspect-square overflow-hidden rounded-lg bg-brand-creamLight text-brand-brown">
                    {m.imagen_url ? (
                      <img src={m.imagen_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="aspect-square w-full flex items-center justify-center">
                        <span className="text-xl font-semibold">{getInitials(m.nombre, m.apellido)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-title text-brand-dark font-semibold break-words">
                      {m.apellido}, {m.nombre}
                    </p>
                    <p className="text-xs text-brand-brown">
                      DNI {m.dni} · WA {m.whatsapp ?? '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-brand-creamLight text-brand-brown flex items-center justify-center overflow-hidden">
                    {m.imagen_url ? (
                      <img src={m.imagen_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold">{getInitials(m.nombre, m.apellido)}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-title text-brand-dark font-semibold break-words">
                      {m.apellido}, {m.nombre}
                    </p>
                    <p className="text-xs text-brand-brown">
                      DNI {m.dni} · WA {m.whatsapp ?? '—'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={m.activo ? 'bg-green-100 text-green-700 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                {(rolesMap[m.id] ?? []).length === 0 ? (
                  <span className="text-xs text-brand-brown/60">Sin roles</span>
                ) : (
                  (rolesMap[m.id] ?? []).map((role) => (
                    <Badge key={role.id} className="bg-brand-creamLight text-brand-brown text-xs">
                      {role.nombre}
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-brand-creamLight">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-teal"
                  onClick={() => router.push(`/admin/misioneros/${m.id}`)}
                >
                  Ver detalle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => setEliminarTarget(m)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!eliminarTarget}
        onOpenChange={(open) => { if (!open) setEliminarTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar misionero?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{eliminarTarget ? `${eliminarTarget.apellido}, ${eliminarTarget.nombre}` : ''}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!eliminarTarget) return;
                try {
                  await deleteMisionero(eliminarTarget.id);
                  setEliminarTarget(null);
                } catch {
                  // no toast here to keep minimal; could add if needed
                }
              }}
              disabled={eliminando}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-brown">
          {table.getFilteredRowModel().rows.length} misionero(s)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
