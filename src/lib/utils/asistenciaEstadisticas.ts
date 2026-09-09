export interface LeccionEstadisticaAsistencia {
  asistentes: number;
  promedioAcumulado: number | null;
}

export const formatPromedioAcumulado = (value: number | null): string => {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

export const calcularEstadisticasAsistenciaPorLeccion = (
  lecciones: { id: string; numero: number }[],
  inscripcionIds: string[],
  asistencias: { leccion_id: string; inscripcion_id: string; asistio: boolean }[],
): Record<string, LeccionEstadisticaAsistencia> => {
  const inscripcionSet = new Set(inscripcionIds);
  const asistentesPorLeccion = new Map<string, number>();
  const leccionesConMarcas = new Set<string>();

  for (const { leccion_id, inscripcion_id, asistio } of asistencias) {
    if (!inscripcionSet.has(inscripcion_id)) continue;
    leccionesConMarcas.add(leccion_id);
    if (asistio) {
      asistentesPorLeccion.set(leccion_id, (asistentesPorLeccion.get(leccion_id) ?? 0) + 1);
    }
  }

  const ordered = [...lecciones].sort((a, b) => a.numero - b.numero);
  const estadisticas: Record<string, LeccionEstadisticaAsistencia> = {};
  let sumaAsistentes = 0;
  let leccionesContadas = 0;

  for (const leccion of ordered) {
    const tieneMarcas = leccionesConMarcas.has(leccion.id);
    const asistentes = asistentesPorLeccion.get(leccion.id) ?? 0;
    if (tieneMarcas) {
      leccionesContadas += 1;
      sumaAsistentes += asistentes;
    }
    estadisticas[leccion.id] = {
      asistentes,
      promedioAcumulado: tieneMarcas ? Math.round((sumaAsistentes / leccionesContadas) * 10) / 10 : null,
    };
  }

  return estadisticas;
};
