'use client';

import { Cake } from 'lucide-react';

type MisioneroCumple = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  diasHasta: number;
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatCumple(fechaNacimiento: string): string {
  const d = new Date(fechaNacimiento);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function CumpleaniosAcordeon({ misioneros }: { misioneros: MisioneroCumple[] }) {
  const hoy = misioneros.filter((m) => m.diasHasta === 0);

  return (
    <details className="group bg-brand-cream border border-brand-gold/40 rounded-xl">
      <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none select-none">
        <div className="flex items-center gap-2 text-brand-dark">
          <Cake className="w-4 h-4 text-brand-gold shrink-0" />
          <span className="font-medium text-sm">
            Cumpleaños en los próximos 30 días
            <span className="ml-2 text-brand-brown font-normal">({misioneros.length})</span>
          </span>
          {hoy.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-gold text-brand-dark">
              {hoy.length === 1 ? '1 hoy' : `${hoy.length} hoy`}
            </span>
          )}
        </div>
        <span className="text-brand-brown text-xs transition-transform group-open:rotate-180">▼</span>
      </summary>

      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        {misioneros.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-brand-dark">
              {m.apellido}, {m.nombre}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-brand-brown">{formatCumple(m.fecha_nacimiento)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                m.diasHasta === 0
                  ? 'bg-brand-gold text-brand-dark'
                  : 'bg-white text-brand-brown border border-brand-creamLight'
              }`}>
                {m.diasHasta === 0 ? '¡Hoy!' : `en ${m.diasHasta}d`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
