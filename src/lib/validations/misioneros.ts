import { z } from 'zod';

export const misioneroSchema = z.object({
  nombre:   z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  dni:      z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  whatsapp: z.string().min(10, 'Número inválido').regex(/^\d+$/, 'Solo números'),
});

export type MisioneroInput = z.infer<typeof misioneroSchema>;
