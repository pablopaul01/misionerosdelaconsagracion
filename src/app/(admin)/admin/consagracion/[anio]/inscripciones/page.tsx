'use client';

import { useParams } from 'next/navigation';
import { useFormacionConsagracion } from '@/lib/queries/consagracion';
import { InscripcionesView } from '@/components/consagracion/InscripcionesView';

export default function AdminInscripcionesPage() {
  const { anio } = useParams<{ anio: string }>();
  const { data: formacion, isLoading } = useFormacionConsagracion(Number(anio));

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">No existe formación para el año {anio}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-title text-2xl text-brand-dark">
        Inscripciones Consagración {anio}
      </h1>
      <InscripcionesView formacionId={formacion.id} />
    </div>
  );
}
