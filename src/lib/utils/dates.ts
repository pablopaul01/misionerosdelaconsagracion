// Utilidades de fechas para el proyecto

/** Formatea una fecha ISO a string legible en español (ej: "lunes 3 de marzo de 2025") */
export const formatFechaLarga = (fechaIso: string): string =>
  new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** Formatea una fecha ISO a string corto (ej: "03/03/2025") */
export const formatFechaCorta = (fechaIso: string): string =>
  new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-AR');

/** Devuelve la fecha actual en formato ISO (YYYY-MM-DD) */
export const hoyIso = (): string =>
  new Date().toISOString().split('T')[0];

/** Calcula el próximo día de semana dado una fecha base (0=domingo..6=sábado) */
export const proximoDiaSemana = (fechaBase: Date, diaSemana: number): Date => {
  const resultado = new Date(fechaBase);
  const diff = (diaSemana - resultado.getDay() + 7) % 7;
  resultado.setDate(resultado.getDate() + diff);
  return resultado;
};
