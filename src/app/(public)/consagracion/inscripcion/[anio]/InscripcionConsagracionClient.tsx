'use client';

import { useState } from 'react';
import { InscripcionForm } from '@/components/consagracion/InscripcionForm';

interface Props {
  formacionId: string;
  anio: string;
}

export function InscripcionConsagracionClient({ formacionId, anio }: Props) {
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm flex flex-col gap-4">
        <p className="text-4xl">🙏</p>
        <p className="font-title text-brand-dark text-xl">¡Inscripción recibida!</p>
        <p className="text-brand-brown text-sm">
          Gracias por inscribirte a la Consagración Total {anio}.
          Pronto recibirás más información.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <InscripcionForm formacionId={formacionId} onSuccess={() => setEnviado(true)} />
    </div>
  );
}
