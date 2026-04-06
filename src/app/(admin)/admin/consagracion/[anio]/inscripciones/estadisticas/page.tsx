'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFormacionConsagracion } from '@/lib/queries/consagracion';
import { InscripcionesEstadisticasView } from '@/components/consagracion/InscripcionesEstadisticasView';

export default function AdminInscripcionesEstadisticasPage() {
  const { anio } = useParams<{ anio: string }>();
  const router = useRouter();
  const { data: formacion, isLoading } = useFormacionConsagracion(Number(anio));

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">No existe formación para el año {anio}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/consagracion/${anio}/inscripciones`)}
          className="text-brand-brown shrink-0"
        >
          ← Volver a inscripciones
        </Button>
        <h1 className="font-title text-xl text-brand-dark">
          Estadisticas de Consagracion {anio}
        </h1>
      </div>

      <InscripcionesEstadisticasView formacionId={formacion.id} />
    </div>
  );
}
