'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { claseSchema } from '@/lib/validations/formaciones';
import { fieldError } from '@/lib/utils/form';
import {
  useClases,
  useAddClase,
  useActivarClase,
  useDesactivarClases,
  useUpdateClaseFecha,
  useDeleteClase,
} from '@/lib/queries/formaciones';
import { formatFechaLarga } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClaseListProps {
  formacionId: string;
}

const NuevaClaseForm = ({ formacionId, proximoNumero }: { formacionId: string; proximoNumero: number }) => {
  const { mutateAsync: addClase } = useAddClase(formacionId);
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: { numero: proximoNumero, fecha: '' },
    validators: { onSubmit: claseSchema },
    onSubmit: async ({ value }) => {
      await addClase(value);
      setOpen(false);
      form.reset();
    },
  });

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-brand-brown text-brand-brown hover:bg-brand-cream"
      >
        + Agregar clase
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-3 bg-brand-cream p-4 rounded-lg sm:flex-row sm:items-end"
    >
      <form.Field name="numero">
        {(field) => (
          <div className="flex flex-col gap-1.5 w-24">
            <Label htmlFor="numero">Nº clase</Label>
            <Input
              id="numero"
              type="number"
              min={1}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="fecha">
        {(field) => (
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="fecha-clase">Fecha</Label>
            <Input
              id="fecha-clase"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      <div className="flex gap-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-brown hover:bg-brand-dark text-white"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export const ClaseList = ({ formacionId }: ClaseListProps) => {
  const { data: clases = [], isLoading } = useClases(formacionId);
  const { mutateAsync: activarClase } = useActivarClase(formacionId);
  const { mutateAsync: desactivarClases } = useDesactivarClases(formacionId);
  const { mutateAsync: updateFecha } = useUpdateClaseFecha(formacionId);
  const { mutateAsync: deleteClase } = useDeleteClase(formacionId);

  const [editandoFecha, setEditandoFecha] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

  const proximoNumero = clases.length + 1;
  const claseActiva = clases.find((c) => c.activa);

  const handleActivar = async (claseId: string) => {
    await activarClase(claseId);
  };

  const handleDesactivar = async () => {
    await desactivarClases();
  };

  const handleGuardarFecha = async (claseId: string) => {
    if (!nuevaFecha) return;
    await updateFecha({ claseId, fecha: nuevaFecha });
    setEditandoFecha(null);
    setNuevaFecha('');
  };

  const handleEliminarClase = async (claseId: string) => {
    try {
      await deleteClase(claseId);
      toast.success('Clase eliminada');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Error al eliminar');
    }
  };

  if (isLoading) return <p className="text-brand-brown">Cargando clases...</p>;

  return (
    <div className="flex flex-col gap-4">
      {claseActiva && (
        <div className="bg-brand-gold/20 border border-brand-gold rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-brand-dark">
            Clase {claseActiva.numero} — {formatFechaLarga(claseActiva.fecha)}
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-600">
                Desactivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Desactivar la clase?</AlertDialogTitle>
                <AlertDialogDescription>
                  Los misioneros ya no podrán registrar asistencia hasta que actives otra clase.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDesactivar} className="bg-red-600 hover:bg-red-700">
                  Desactivar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {clases.map((clase) => (
          <div
            key={clase.id}
            className="flex flex-col gap-2 bg-white border border-brand-creamLight rounded-lg px-4 py-3"
          >
            {/* Fila 1: info */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-brand-dark shrink-0">
                Clase {clase.numero}
              </span>

              {editandoFecha === clase.id ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <Input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    className="bg-brand-brown text-white h-8"
                    onClick={() => handleGuardarFecha(clase.id)}
                  >
                    OK
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => setEditandoFecha(null)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <button
                  className="text-sm text-brand-brown hover:underline text-left"
                  onClick={() => {
                    setEditandoFecha(clase.id);
                    setNuevaFecha(clase.fecha);
                  }}
                >
                  {formatFechaLarga(clase.fecha)}
                </button>
              )}

              {clase.activa && (
                <Badge className="bg-brand-gold text-brand-dark text-xs">Activa</Badge>
              )}
            </div>

            {/* Fila 2: acciones */}
            {!clase.activa && (
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-brand-teal border-brand-teal">
                      Activar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Activar clase {clase.numero}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Los misioneros podrán registrar su asistencia a esta clase.
                        {claseActiva && ' La clase activa actual se desactivará.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleActivar(clase.id)}
                        className="bg-brand-teal hover:bg-brand-navy text-white"
                      >
                        Activar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar clase {clase.numero}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Solo se puede eliminar si no tiene asistencias registradas. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleEliminarClase(clase.id)}
                        className="bg-red-500 hover:bg-red-700 text-white"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </div>

      <NuevaClaseForm formacionId={formacionId} proximoNumero={proximoNumero} />
    </div>
  );
};
