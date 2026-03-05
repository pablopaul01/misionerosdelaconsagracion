// Constantes del módulo Consagración Total
export const MAX_LECCIONES = 33;
export const MAX_RETIROS = 2;
export const TOTAL_SESIONES = MAX_LECCIONES + MAX_RETIROS; // 35

export const TIPO_LECCION = {
  LECCION: 'leccion',
  RETIRO:  'retiro',
} as const;

export type TipoLeccion = (typeof TIPO_LECCION)[keyof typeof TIPO_LECCION];

export const ESTADO_CIVIL = {
  SOLTERO_A:   'soltero_a',
  CASADO:      'casado',
  DIVORCIADO:  'divorciado',
  VIUDO:       'viudo',
} as const;

export type EstadoCivil = (typeof ESTADO_CIVIL)[keyof typeof ESTADO_CIVIL];

export const ESTADO_CIVIL_LABEL: Record<EstadoCivil, string> = {
  soltero_a:  'Soltero/a',
  casado:     'Casado/a',
  divorciado: 'Divorciado/a',
  viudo:      'Viudo/a',
};

export const SACRAMENTOS = [
  { value: 'bautismo',      label: 'Bautismo' },
  { value: 'comunion',      label: 'Primera Comunión' },
  { value: 'confirmacion',  label: 'Confirmación' },
  { value: 'matrimonio',    label: 'Matrimonio' },
] as const;
