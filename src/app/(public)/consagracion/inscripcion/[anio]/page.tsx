'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useFormacionConsagracion } from '@/lib/queries/consagracion';
import { InscripcionForm } from '@/components/consagracion/InscripcionForm';

export default function InscripcionConsagracionPage() {
  const { anio } = useParams<{ anio: string }>();
  const anioNum = Number(anio);
  const { data: formacion, isLoading } = useFormacionConsagracion(anioNum);
  const [enviado, setEnviado] = useState(false);

  return (
    <main className="min-h-screen bg-brand-cream py-10 px-4">
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <Image
              src="/logo_parroquia.png"
              alt="Logo Parroquia"
              width={70}
              height={70}
              className="object-contain"
            />
            <Image
              src="/logomisioneros.png"
              alt="Logo Misioneros"
              width={110}
              height={110}
              className="object-contain"
            />
          </div>
          <h1 className="font-title text-brand-dark text-2xl text-center tracking-wide">
            Consagración Total a Jesús por María
          </h1>
          <p className="text-brand-brown text-center">Inscripción {anio}</p>
        </div>

        {isLoading && <p className="text-center text-brand-brown">Cargando...</p>}

        {!isLoading && !formacion && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-brand-dark font-title text-lg">Inscripciones no disponibles</p>
            <p className="text-sm text-brand-brown mt-2">
              No hay inscripciones abiertas para el año {anio}.
            </p>
          </div>
        )}

        {!isLoading && formacion && !enviado && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <InscripcionForm
              formacionId={formacion.id}
              onSuccess={() => setEnviado(true)}
            />
          </div>
        )}

        {enviado && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex flex-col gap-4">
            <p className="text-4xl">🙏</p>
            <p className="font-title text-brand-dark text-xl">¡Inscripción recibida!</p>
            <p className="text-brand-brown text-sm">
              Gracias por inscribirte a la Consagración Total {anio}.
              Pronto recibirás más información.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
