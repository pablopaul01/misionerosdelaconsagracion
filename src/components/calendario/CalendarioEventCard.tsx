'use client';

import { CALENDARIO_ORIGEN_LABEL } from '@/lib/constants/calendario';
import type { ActividadCalendario } from '@/types/calendario';

interface CalendarioEventCardProps {
  actividad: ActividadCalendario;
  onClick?: (id: string) => void;
}

export function CalendarioEventCard({ actividad, onClick }: CalendarioEventCardProps) {
  const formatDateRange = () => {
    const inicio = new Date(`${actividad.fecha_inicio}T00:00:00`);
    const inicioStr = inicio.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    if (!actividad.fecha_fin) {
      return inicioStr;
    }

    const fin = new Date(`${actividad.fecha_fin}T00:00:00`);
    const finStr = fin.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
    });

    return `${inicioStr} - ${finStr}`;
  };

  return (
    <article
      className="rounded-xl border border-brand-creamLight bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => onClick?.(actividad.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(actividad.id);
        }
      }}
    >
      <p className="text-xs uppercase tracking-wide text-brand-brown/70">
        {CALENDARIO_ORIGEN_LABEL[actividad.origen_tipo]}
      </p>
      <h3 className="mt-1 font-title text-lg text-brand-dark">{actividad.titulo}</h3>
      <p className="mt-1 text-sm text-brand-brown">{actividad.tipo}</p>
      <p className="mt-3 text-sm text-brand-brown/90">{formatDateRange()}</p>
      {actividad.descripcion && (
        <p className="mt-3 border-t border-brand-creamLight pt-3 text-sm leading-relaxed text-brand-brown/80">
          {actividad.descripcion}
        </p>
      )}
      {actividad.estado === 'cancelado' && (
        <span className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
          Cancelado
        </span>
      )}
    </article>
  );
}
