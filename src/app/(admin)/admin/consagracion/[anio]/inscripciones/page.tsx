'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormacionConsagracion, useFinalizarFormacion } from '@/lib/queries/consagracion';
import { InscripcionesView } from '@/components/consagracion/InscripcionesView';
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

export default function AdminInscripcionesPage() {
  const { anio } = useParams<{ anio: string }>();
  const router = useRouter();
  const { data: formacion, isLoading } = useFormacionConsagracion(Number(anio));
  const { mutateAsync: finalizar, isPending: finalizando } = useFinalizarFormacion();

  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [errorFinalizar, setErrorFinalizar] = useState('');

  const handleFinalizar = async () => {
    if (!formacion) return;
    setErrorFinalizar('');
    try {
      await finalizar(formacion.id);
      setConfirmarFinalizar(false);
    } catch (e) {
      setErrorFinalizar((e as Error)?.message ?? 'Error al finalizar');
    }
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">No existe formación para el año {anio}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown">
          ← Volver
        </Button>
        <h1 className="font-title text-2xl text-brand-dark break-words flex-1">
          Inscripciones Consagración {anio}
        </h1>
        {formacion.finalizada ? (
          <Badge className="bg-green-700 text-white text-sm px-3 py-1">FINALIZADA</Badge>
        ) : (
          <Button
            variant="outline"
            className="border-brand-gold text-brand-dark hover:bg-brand-gold/10 shrink-0"
            onClick={() => setConfirmarFinalizar(true)}
          >
            Finalizar consagración
          </Button>
        )}
      </div>

      <InscripcionesView formacionId={formacion.id} />

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
