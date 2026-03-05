'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMisioneros } from '@/lib/queries/misioneros';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const COLUMNS: ColumnDef<Misionero>[] = [
  { accessorKey: 'apellido', header: 'Apellido' },
  { accessorKey: 'nombre',   header: 'Nombre' },
  { accessorKey: 'dni',      header: 'DNI' },
  { accessorKey: 'whatsapp', header: 'WhatsApp' },
  {
    id: 'acciones',
    header: '',
    cell: ({ row }) => <AccionesCell id={row.original.id} />,
  },
];

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
  const { data: misioneros = [], isLoading } = useMisioneros();
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data: misioneros,
    columns: COLUMNS,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

      <div className="rounded-lg border border-brand-creamLight overflow-hidden">
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
                <TableCell colSpan={COLUMNS.length} className="text-center text-brand-brown py-8">
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
