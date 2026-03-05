import { z } from 'zod';
import { TIPO_FORMACION } from '@/lib/constants/formaciones';

export const formacionSchema = z.object({
  tipo:        z.enum([TIPO_FORMACION.SAN_LORENZO, TIPO_FORMACION.ESCUELA_MARIA]),
  anio:        z.number().int().min(2020).max(2100),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  dia_semana:  z.number().int().min(0).max(6),
});

export const claseSchema = z.object({
  numero: z.number().int().min(1),
  fecha:  z.string().min(1, 'La fecha es requerida'),
});

export const inscripcionMisioneroSchema = z.object({
  misionero_id: z.string().uuid(),
  formacion_id: z.string().uuid(),
});

export type FormacionInput = z.infer<typeof formacionSchema>;
export type ClaseInput = z.infer<typeof claseSchema>;
