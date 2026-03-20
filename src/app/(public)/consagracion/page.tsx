import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ConsagracionPage() {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('formaciones_consagracion')
    .select('anio')
    .eq('activa', true)
    .maybeSingle();

  if (data?.anio) {
    redirect(`/consagracion/inscripcion/${data.anio}`);
  }

  return (
    <main className="min-h-screen bg-brand-cream py-10 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full flex flex-col items-center gap-6">
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
        <div className="bg-white rounded-2xl p-6 w-full text-center shadow-sm">
          <p className="text-brand-dark font-title text-lg">Inscripciones no disponibles</p>
          <p className="text-sm text-brand-brown mt-2">
            No hay inscripciones abiertas en este momento.<br />
            Volvé a revisar próximamente.
          </p>
        </div>
      </div>
    </main>
  );
}
