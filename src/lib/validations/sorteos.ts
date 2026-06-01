import { z } from 'zod';
import {
  SORTEO_ESTADOS,
  SORTEO_METODOS_PAGO,
  SORTEO_REGISTRO_TIPOS,
} from '@/lib/constants/sorteos';

const uuidSchema = z.string().uuid('ID inválido');

export const sorteoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string(),
  estado: z.enum([
    SORTEO_ESTADOS.ACTIVO,
    SORTEO_ESTADOS.FINALIZADO,
    SORTEO_ESTADOS.CANCELADO,
  ] as const),
  costo_numero: z.number().positive('El costo debe ser mayor a cero'),
  cantidad_premios: z.number().int().positive('Debe haber al menos un premio'),
  numero_desde: z.number().int().positive('El número inicial debe ser positivo'),
  numero_hasta: z.number().int().positive('El número final debe ser positivo').nullable(),
}).refine(
  (data) => data.numero_hasta === null || data.numero_hasta >= data.numero_desde,
  { message: 'El número final debe ser mayor o igual al inicial', path: ['numero_hasta'] },
);

export const sorteoParticipanteSchema = z.object({
  sorteo_id: uuidSchema,
  registro_tipo: z.enum([
    SORTEO_REGISTRO_TIPOS.CONVERSION,
    SORTEO_REGISTRO_TIPOS.MATRIMONIOS,
    SORTEO_REGISTRO_TIPOS.MISIONEROS,
  ] as const),
  registro_id: uuidSchema,
});

export const sorteoAsignacionSchema = z.object({
  sorteo_id: uuidSchema,
  participante_id: uuidSchema,
  cantidad: z.number().int().positive('La cantidad debe ser positiva'),
});

export const sorteoPagoMetodoSchema = z.object({
  metodo: z.enum([
    SORTEO_METODOS_PAGO.EFECTIVO,
    SORTEO_METODOS_PAGO.TRANSFERENCIA,
  ] as const),
  monto: z.number().positive('El monto debe ser mayor a cero'),
});

export const sorteoPagoSchema = z.object({
  sorteo_id: uuidSchema,
  numeros: z.array(z.number().int().positive()).min(1, 'Seleccioná al menos un número'),
  metodos: z.array(sorteoPagoMetodoSchema).min(1, 'Agregá al menos un método de pago'),
});

export const sorteoDrawSchema = z.object({
  sorteo_id: uuidSchema,
});

export type SorteoInput = z.infer<typeof sorteoSchema>;
export type SorteoParticipanteInput = z.infer<typeof sorteoParticipanteSchema>;
export type SorteoAsignacionInput = z.infer<typeof sorteoAsignacionSchema>;
export type SorteoPagoMetodoInput = z.infer<typeof sorteoPagoMetodoSchema>;
export type SorteoPagoInput = z.infer<typeof sorteoPagoSchema>;
export type SorteoDrawInput = z.infer<typeof sorteoDrawSchema>;
