export const CALENDARIO_ORIGEN = {
  MANUAL: 'manual',
  CONSAGRACION_FORMACION: 'consagracion_formacion',
  CONSAGRACION_RETIRO: 'consagracion_retiro',
  RETIRO: 'retiro',
  FORMACION_MISIONEROS: 'formacion_misioneros',
} as const;

export type CalendarioOrigen = (typeof CALENDARIO_ORIGEN)[keyof typeof CALENDARIO_ORIGEN];

export const CALENDARIO_ESTADO = {
  ACTIVO: 'activo',
  CANCELADO: 'cancelado',
} as const;

export type CalendarioEstado = (typeof CALENDARIO_ESTADO)[keyof typeof CALENDARIO_ESTADO];

export const CALENDARIO_ORIGEN_LABEL: Record<CalendarioOrigen, string> = {
  [CALENDARIO_ORIGEN.MANUAL]: 'Manual',
  [CALENDARIO_ORIGEN.CONSAGRACION_FORMACION]: 'Consagracion formacion',
  [CALENDARIO_ORIGEN.CONSAGRACION_RETIRO]: 'Consagracion retiro',
  [CALENDARIO_ORIGEN.RETIRO]: 'Retiro',
  [CALENDARIO_ORIGEN.FORMACION_MISIONEROS]: 'Formacion misioneros',
};

export const CALENDARIO_MAX_RANGE_DIAS = 120;
export const CALENDARIO_DEFAULT_RANGE_DIAS = 45;
export const CALENDARIO_MAX_RESULTADOS = 100;
