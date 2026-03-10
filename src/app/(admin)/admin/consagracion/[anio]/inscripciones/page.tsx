'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormacionConsagracion, useFinalizarFormacion } from '@/lib/queries/consagracion';
import { InscripcionesView } from '@/components/consagracion/InscripcionesView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function AdminInscripcionesPage() {
  const { anio } = useParams<{ anio: string }>();
  const router = useRouter();
  const { data: formacion, isLoading } = useFormacionConsagracion(Number(anio));
  const { mutateAsync: finalizar, isPending: finalizando } = useFinalizarFormacion();

  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [errorFinalizar, setErrorFinalizar] = useState('');
  const [fechaConsagracion, setFechaConsagracion] = useState('');

  const handleFinalizar = async () => {
    if (!formacion) return;
    setErrorFinalizar('');
    if (!fechaConsagracion) {
      setErrorFinalizar('Seleccioná la fecha de consagración');
      return;
    }
    try {
      await finalizar({ id: formacion.id, fechaConsagracion });
      setConfirmarFinalizar(false);
    } catch (e) {
      setErrorFinalizar((e as Error)?.message ?? 'Error al finalizar');
    }
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">No existe formación para el año {anio}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown shrink-0">
          ← Volver
        </Button>
        <h1 className="font-title text-xl text-brand-dark">
          Consagración {anio}
        </h1>
      </div>

      <InscripcionesView
        formacionId={formacion.id}
        finalizada={formacion.finalizada}
        onFinalizar={() => {
          setFechaConsagracion(formacion.fecha_consagracion ?? new Date().toISOString().split('T')[0]);
          setConfirmarFinalizar(true);
        }}
        finalizando={finalizando}
        fechaConsagracion={formacion.fecha_consagracion}
      />

      <AlertDialog
        open={confirmarFinalizar}
        onOpenChange={(open) => { if (!open) { setConfirmarFinalizar(false); setErrorFinalizar(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar la consagración {anio}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marca la formación como concluida. Podés seguir editando las inscripciones y asistencias
              después, pero la formación quedará marcada como finalizada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de consagración</Label>
            <Input
              type="date"
              value={fechaConsagracion}
              onChange={(e) => setFechaConsagracion(e.target.value)}
            />
          </div>
          {errorFinalizar && <p className="text-sm text-red-600 px-1">{errorFinalizar}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-brown hover:bg-brand-dark text-white"
              onClick={handleFinalizar}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
