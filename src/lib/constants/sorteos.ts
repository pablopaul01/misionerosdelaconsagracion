export const SORTEO_ESTADOS = {
  ACTIVO: 'activo',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
} as const;

export const SORTEO_ESTADO_LABEL = {
  [SORTEO_ESTADOS.ACTIVO]: 'Activo',
  [SORTEO_ESTADOS.FINALIZADO]: 'Finalizado',
  [SORTEO_ESTADOS.CANCELADO]: 'Cancelado',
} as const;

export const SORTEO_REGISTRO_TIPOS = {
  CONVERSION: 'conversion',
  MATRIMONIOS: 'matrimonios',
  MISIONEROS: 'misioneros',
} as const;

export const SORTEO_REGISTRO_TIPO_LABEL = {
  [SORTEO_REGISTRO_TIPOS.CONVERSION]: 'Retiro de conversión',
  [SORTEO_REGISTRO_TIPOS.MATRIMONIOS]: 'Retiro de matrimonios',
  [SORTEO_REGISTRO_TIPOS.MISIONEROS]: 'Retiro de misioneros',
} as const;

export const SORTEO_METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
} as const;

export const SORTEO_METODO_PAGO_LABEL = {
  [SORTEO_METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [SORTEO_METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
} as const;

export const SORTEOS_ROUTES = {
  LIST: '/admin/sorteos',
  DETAIL: (id: string) => `/admin/sorteos/${id}`,
} as const;

export type SorteoEstado = (typeof SORTEO_ESTADOS)[keyof typeof SORTEO_ESTADOS];
export type SorteoRegistroTipo = (typeof SORTEO_REGISTRO_TIPOS)[keyof typeof SORTEO_REGISTRO_TIPOS];
export type SorteoMetodoPago = (typeof SORTEO_METODOS_PAGO)[keyof typeof SORTEO_METODOS_PAGO];
