// Constantes del módulo Retiros

import { type Database } from '@/types/supabase';

export type TipoRetiro = Database['public']['Enums']['tipo_retiro'];

export const TIPO_RETIRO: Record<TipoRetiro, TipoRetiro> = {
  conversion: 'conversion',
  matrimonios: 'matrimonios',
  misioneros: 'misioneros',
};

export const TIPO_RETIRO_LABEL: Record<TipoRetiro, string> = {
  conversion: 'Retiro de Conversión',
  matrimonios: 'Retiro de Matrimonios',
  misioneros: 'Retiro de Misioneros',
};

export const TIPO_RETIRO_PUBLICO: Record<TipoRetiro, string> = {
  conversion: 'Retiro Espiritual',
  matrimonios: 'Retiro de Matrimonios',
  misioneros: 'Retiro de Misioneros',
};

export const ESTADO_CIVIL = {
  SOLTERO_A: 'soltero_a',
  CASADO: 'casado',
  DIVORCIADO: 'divorciado',
  VIUDO: 'viudo',
} as const;

export type EstadoCivil = (typeof ESTADO_CIVIL)[keyof typeof ESTADO_CIVIL];

export const ESTADO_CIVIL_LABEL: Record<EstadoCivil, string> = {
  soltero_a: 'Soltero/a',
  casado: 'Casado/a',
  divorciado: 'Divorciado/a',
  viudo: 'Viudo/a',
};

export const ESTADO_RELACION = {
  UNION_LIBRE: 'union_libre',
  CASADOS: 'casados',
  COMPROMETIDOS: 'comprometidos',
  NOVIOS: 'novios',
} as const;

export type EstadoRelacion = (typeof ESTADO_RELACION)[keyof typeof ESTADO_RELACION];

export const ESTADO_RELACION_LABEL: Record<EstadoRelacion, string> = {
  union_libre: 'Unión libre',
  casados: 'Casados',
  comprometidos: 'Comprometidos',
  novios: 'Novios',
};

export const METODO_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA: 'tarjeta',
} as const;

export type MetodoPago = (typeof METODO_PAGO)[keyof typeof METODO_PAGO];

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

// Secciones del formulario de conversión
export const SECCIONES_CONVERSION = {
  DATOS_PERSONALES: 1,
  CONTACTOS_CARTA: 2,
  SALUD: 3,
  INFO_RETIRO: 4,
} as const;

export const SECCIONES_CONVERSION_LABEL: Record<number, string> = {
  1: 'Datos personales',
  2: 'Contactos',
  3: 'Salud',
  4: 'Información del retiro',
};

// Secciones del formulario de matrimonios
export const SECCIONES_MATRIMONIOS = {
  DATOS_ESPOSO: 1,
  DATOS_ESPOSA: 2,
  DATOS_PAREJA: 3,
} as const;

export const SECCIONES_MATRIMONIOS_LABEL: Record<number, string> = {
  1: 'Datos del esposo',
  2: 'Datos de la esposa',
  3: 'Datos de la pareja',
};
