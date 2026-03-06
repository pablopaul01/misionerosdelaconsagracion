'use client';

import { useToggleAsistenciaConsagracion } from '@/lib/queries/consagracion';
import { cn } from '@/lib/utils';

interface AsistenciaToggleProps {
  formacionId: string;
  leccionId: string;
  inscripcionId: string;
  asistenciaId?: string;
  asistio?: boolean;
}

/** Celda clickeable que alterna asistencia en la grilla de consagración */
export const AsistenciaToggle = ({
  formacionId,
  leccionId,
  inscripcionId,
  asistenciaId,
  asistio,
}: AsistenciaToggleProps) => {
  const { mutate, isPending } = useToggleAsistenciaConsagracion(formacionId);

  const handleClick = () => {
    // Ciclo: sin registro → asistió → no asistió → asistió
    const nuevoValor = asistio === undefined ? true : !asistio;
    mutate({ leccionId, inscripcionId, asistio: nuevoValor, asistenciaId });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'w-8 h-8 rounded-full text-sm font-bold transition-colors flex items-center justify-center',
        asistio === true  && 'bg-green-100 text-green-700 hover:bg-green-200',
        asistio === false && 'bg-red-100 text-red-600 hover:bg-red-200',
        asistio === undefined && 'bg-gray-100 text-gray-400 hover:bg-gray-200',
        isPending && 'opacity-50 cursor-wait',
      )}
      title={asistio === undefined ? 'Sin registrar — click para marcar' : asistio ? 'Asistió — click para cambiar' : 'No asistió — click para cambiar'}
    >
      {asistio === true ? '✓' : asistio === false ? '✗' : '·'}
    </button>
  );
};
