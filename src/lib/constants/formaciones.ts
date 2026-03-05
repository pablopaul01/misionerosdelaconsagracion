// Tipos de formación de misioneros
export const TIPO_FORMACION = {
  SAN_LORENZO:    'san_lorenzo',
  ESCUELA_MARIA:  'escuela_de_maria',
} as const;

export type TipoFormacion = (typeof TIPO_FORMACION)[keyof typeof TIPO_FORMACION];

export const TIPO_FORMACION_LABEL: Record<TipoFormacion, string> = {
  san_lorenzo:     'San Lorenzo',
  escuela_de_maria: 'Escuela de María',
};

// Días de la semana (0 = domingo)
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
