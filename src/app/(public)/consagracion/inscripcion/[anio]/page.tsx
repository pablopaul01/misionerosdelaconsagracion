import Image from 'next/image';
import { InscripcionConsagracionClient } from './InscripcionConsagracionClient';
import { getFormacionByAnio } from './actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ anio: string }>;
}

export default async function InscripcionConsagracionPage({ params }: Props) {
  const { anio } = await params;
  const anioNum = Number(anio);
  const formacion = await getFormacionByAnio(anioNum);

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

        {!formacion ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-brand-dark font-title text-lg">Inscripciones no disponibles</p>
            <p className="text-sm text-brand-brown mt-2">
              No hay inscripciones abiertas para el año {anio}.
            </p>
          </div>
        ) : (
          <InscripcionConsagracionClient formacionId={formacion.id} anio={anio} />
        )}
      </div>
    </main>
  );
}
