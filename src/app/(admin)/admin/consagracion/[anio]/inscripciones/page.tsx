'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFormacionConsagracion } from '@/lib/queries/consagracion';
import { InscripcionesView } from '@/components/consagracion/InscripcionesView';
import { Button } from '@/components/ui/button';

export default function AdminInscripcionesPage() {
  const { anio } = useParams<{ anio: string }>();
  const router = useRouter();
  const { data: formacion, isLoading } = useFormacionConsagracion(Number(anio));

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">No existe formación para el año {anio}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown">
          ← Volver
        </Button>
        <h1 className="font-title text-2xl text-brand-dark break-words">
          Inscripciones Consagración {anio}
        </h1>
      </div>
      <InscripcionesView formacionId={formacion.id} />
    </div>
  );
}
