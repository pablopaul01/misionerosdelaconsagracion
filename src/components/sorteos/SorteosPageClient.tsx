'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { toast } from 'sonner';
import { Calendar, DollarSign, Gift, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SORTEO_ESTADO_LABEL, SORTEOS_ROUTES } from '@/lib/constants/sorteos';
import { useCreateSorteo, useSorteos } from '@/lib/queries/sorteos';
import { sorteoSchema, type SorteoInput } from '@/lib/validations/sorteos';

const DEFAULT_SORTEO_VALUES: SorteoInput = {
  nombre: '',
  descripcion: '',
  estado: 'activo',
  costo_numero: 0,
  cantidad_premios: 1,
  numero_desde: 1,
  numero_hasta: null,
};

export function SorteosPageClient() {
  const router = useRouter();
  const { data: sorteos = [], isLoading } = useSorteos();
  const createSorteo = useCreateSorteo();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: DEFAULT_SORTEO_VALUES,
    validators: { onChange: sorteoSchema },
    onSubmit: async ({ value }) => {
      try {
        const sorteo = await createSorteo.mutateAsync(value);
        toast.success('Sorteo creado');
        setIsCreateDialogOpen(false);
        router.push(SORTEOS_ROUTES.DETAIL(sorteo.id));
      } catch {
        toast.error('No se pudo crear el sorteo');
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title text-3xl text-brand-dark">Sorteos y rifas</h1>
          <p className="text-brand-brown">Administrá números, rendiciones y ganadores.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown text-white hover:bg-brand-dark">
              <Plus className="mr-2 h-4 w-4" /> Nuevo sorteo
            </Button>
          </DialogTrigger>
          <DialogContent onPointerDownOutside={(event) => event.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Nuevo sorteo</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field name="nombre">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Nombre</Label>
                    <Input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
                  </div>
                )}
              </form.Field>
              <form.Field name="descripcion">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Descripción</Label>
                    <Textarea value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
                  </div>
                )}
              </form.Field>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="costo_numero">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label>Costo por número</Label>
                      <Input type="number" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="cantidad_premios">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label>Premios</Label>
                      <Input type="number" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} />
                    </div>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="numero_desde">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label>Desde</Label>
                      <Input type="number" value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} />
                    </div>
                  )}
                </form.Field>
                <form.Field name="numero_hasta">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label>Hasta</Label>
                      <Input
                        type="number"
                        value={field.state.value ?? ''}
                        onChange={(event) => field.handleChange(event.target.value ? Number(event.target.value) : null)}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
              <Button type="submit" disabled={createSorteo.isPending}>Crear sorteo</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-brand-brown">Cargando...</p>
      ) : sorteos.length === 0 ? (
        <Card><CardContent className="p-6 text-brand-brown">Todavía no hay sorteos.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorteos.map((sorteo) => (
            <Card key={sorteo.id} className="cursor-pointer transition hover:shadow-md" onClick={() => router.push(SORTEOS_ROUTES.DETAIL(sorteo.id))}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-brand-dark">{sorteo.nombre}</CardTitle>
                  <Badge>{SORTEO_ESTADO_LABEL[sorteo.estado]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-brand-brown">
                <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> ${Number(sorteo.costo_numero).toLocaleString('es-AR')} por número</span>
                <span className="flex items-center gap-2"><Gift className="h-4 w-4" /> {sorteo.cantidad_premios} premios</span>
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Creado {new Date(sorteo.created_at).toLocaleDateString('es-AR')}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
