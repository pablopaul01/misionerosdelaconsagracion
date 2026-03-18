import { z } from 'zod';
import {
  CALENDARIO_DEFAULT_RANGE_DIAS,
  CALENDARIO_ESTADO,
  CALENDARIO_MAX_RANGE_DIAS,
  CALENDARIO_ORIGEN,
} from '@/lib/constants/calendario';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const consultaCalendarioDniSchema = z
  .object({
    dni: z
      .string()
      .trim()
      .regex(/^\d{7,10}$/, 'DNI invalido'),
    desde: z.string().regex(fechaRegex, 'Fecha desde invalida').optional(),
    hasta: z.string().regex(fechaRegex, 'Fecha hasta invalida').optional(),
  })
  .transform(({ dni, desde, hasta }) => {
    const hoy = new Date();
    const baseDesde = desde ?? hoy.toISOString().slice(0, 10);
    const defaultHasta = new Date(hoy);
    defaultHasta.setDate(defaultHasta.getDate() + CALENDARIO_DEFAULT_RANGE_DIAS);
    const baseHasta = hasta ?? defaultHasta.toISOString().slice(0, 10);

    const desdeDate = new Date(`${baseDesde}T00:00:00.000Z`);
    const hastaDate = new Date(`${baseHasta}T23:59:59.999Z`);

    if (hastaDate < desdeDate) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['hasta'],
          message: 'La fecha hasta debe ser posterior a desde',
        },
      ]);
    }

    const dias = Math.ceil((hastaDate.getTime() - desdeDate.getTime()) / 86_400_000);
    if (dias > CALENDARIO_MAX_RANGE_DIAS) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['hasta'],
          message: `El rango maximo es de ${CALENDARIO_MAX_RANGE_DIAS} dias`,
        },
      ]);
    }

    return {
      dni,
      desde: baseDesde,
      hasta: baseHasta,
    };
  });

export const actividadManualSchema = z.object({
  titulo: z.string().trim().min(3, 'Titulo requerido'),
  descripcion: z.string().trim().max(1200, 'Descripcion demasiado larga').nullable(),
  fecha_inicio: z.string().regex(fechaRegex, 'Fecha de inicio invalida'),
  fecha_fin: z.string().regex(fechaRegex, 'Fecha de fin invalida').nullable(),
  tipo: z.string().trim().min(2, 'Tipo requerido'),
  estado: z.enum([CALENDARIO_ESTADO.ACTIVO, CALENDARIO_ESTADO.CANCELADO]),
  nota_admin: z.string().trim().max(500, 'Nota demasiado larga').nullable(),
});

export const actividadUpdateSchema = actividadManualSchema.partial();

export const actividadUpdateSincronizadaSchema = z.object({
  descripcion: z.string().trim().max(1200, 'Descripcion demasiado larga').nullable().optional(),
  estado: z.enum([CALENDARIO_ESTADO.ACTIVO, CALENDARIO_ESTADO.CANCELADO]).optional(),
  nota_admin: z.string().trim().max(500, 'Nota demasiado larga').nullable().optional(),
});

export const actividadFiltroAdminSchema = z.object({
  origen_tipo: z
    .enum([
      CALENDARIO_ORIGEN.MANUAL,
      CALENDARIO_ORIGEN.CONSAGRACION_FORMACION,
      CALENDARIO_ORIGEN.CONSAGRACION_RETIRO,
      CALENDARIO_ORIGEN.RETIRO,
      CALENDARIO_ORIGEN.FORMACION_MISIONEROS,
    ])
    .optional(),
  estado: z.enum([CALENDARIO_ESTADO.ACTIVO, CALENDARIO_ESTADO.CANCELADO]).optional(),
  desde: z.string().regex(fechaRegex).optional(),
  hasta: z.string().regex(fechaRegex).optional(),
  tipo: z.string().trim().min(1).optional(),
});

export type ConsultaCalendarioDniInput = z.infer<typeof consultaCalendarioDniSchema>;
export type ActividadManualInput = z.infer<typeof actividadManualSchema>;
export type ActividadUpdateInput = z.infer<typeof actividadUpdateSchema>;
