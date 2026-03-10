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
import { useMisioneros, useMisionerosRolesMap, useDeleteMisionero } from '@/lib/queries/misioneros';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/types/supabase';

type Misionero = Database['public']['Tables']['misioneros']['Row'];

// Celda de acciones separada para mantener el hook fuera del array de columnas
const AccionesCell = ({ id }: { id: string }) => {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-brand-teal"
      onClick={() => router.push(`/admin/misioneros/${id}`)}
    >
      Ver detalle
    </Button>
  );
};

export const MisioneroTable = () => {
  const router = useRouter();
  const { data: misioneros = [], isLoading } = useMisioneros();
  const { data: rolesMap = {} } = useMisionerosRolesMap();
  const { mutateAsync: deleteMisionero, isPending: eliminando } = useDeleteMisionero();
  const [globalFilter, setGlobalFilter] = useState('');
  const [eliminarTarget, setEliminarTarget] = useState<Misionero | null>(null);

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
    {
      id: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge className={row.original.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
          {row.original.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = rolesMap[row.original.id] ?? [];
        if (roles.length === 0) {
          return <span className="text-xs text-brand-brown/60">Sin roles</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.id} className="bg-brand-creamLight text-brand-brown text-xs">
                {role.nombre}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => <AccionesCell id={row.original.id} />,
    },
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

      {/* ── Desktop: tabla ── */}
      <div className="hidden md:block rounded-lg border border-brand-creamLight overflow-hidden">
        <Table>
          <TableHeader className="bg-brand-creamLight">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-brand-dark font-title">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-brand-brown py-8">
                  No hay misioneros registrados
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
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
        {table.getRowModel().rows.length === 0 && (
          <p className="text-center text-brand-brown py-6">No hay misioneros registrados</p>
        )}
        {table.getRowModel().rows.map((row) => {
          const m = row.original;
          return (
            <div key={m.id} className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="font-title text-brand-dark font-semibold break-words">
                  {m.apellido}, {m.nombre}
                </p>
                <p className="text-xs text-brand-brown">
                  DNI {m.dni} · WA {m.whatsapp ?? '—'}
                </p>
                <Badge className={m.activo ? 'bg-green-100 text-green-700 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                <div className="flex flex-wrap gap-1">
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
                } catch (e) {
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
