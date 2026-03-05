import { z } from 'zod';
import { ESTADO_CIVIL } from '@/lib/constants/consagracion';

// Configuración de campos — agregar aquí para extender el formulario sin tocar el componente
export const CONSAGRACION_FIELDS = [
  { name: 'nombre',       label: 'Nombre',    type: 'text',     required: true  },
  { name: 'apellido',     label: 'Apellido',  type: 'text',     required: true  },
  { name: 'dni',          label: 'DNI',       type: 'tel',      required: true  },
  { name: 'domicilio',    label: 'Domicilio', type: 'text',     required: false },
  { name: 'whatsapp',     label: 'WhatsApp (sin +, solo números)', type: 'tel', required: true },
  { name: 'estado_civil', label: 'Estado civil', type: 'select', required: true,
    options: Object.values(ESTADO_CIVIL).map((v) => ({
      value: v,
      label: { soltero_a: 'Soltero/a', casado: 'Casado/a', divorciado: 'Divorciado/a', viudo: 'Viudo/a' }[v],
    })),
  },
  { name: 'tipo_inscripcion', label: '¿Es tu primera Consagración o es una renovación?', type: 'radio', required: true,
    options: [
      { value: 'primera_vez', label: 'Primera vez' },
      { value: 'renovacion',  label: 'Renovación'  },
    ],
  },
  { name: 'sacramentos',  label: 'Sacramentos recibidos', type: 'checkboxGroup', required: false,
    options: [
      { value: 'bautismo',     label: 'Bautismo' },
      { value: 'comunion',     label: 'Primera Comunión' },
      { value: 'confirmacion', label: 'Confirmación' },
      { value: 'matrimonio',   label: 'Matrimonio' },
    ],
  },
  { name: 'comentario', label: 'Comentario / Sugerencia', type: 'textarea', required: false },
] as const;

export const inscripcionConsagracionSchema = z.object({
  nombre:            z.string().min(1, 'El nombre es requerido'),
  apellido:          z.string().min(1, 'El apellido es requerido'),
  dni:               z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  domicilio:         z.string(),
  whatsapp:          z.string().min(8, 'Número inválido').regex(/^\d+$/, 'Solo números'),
  estado_civil:      z.enum(['soltero_a', 'casado', 'divorciado', 'viudo']),
  tipo_inscripcion:  z.enum(['primera_vez', 'renovacion'], { message: 'Seleccioná una opción' }),
  sacramentos:       z.array(z.string()),
  comentario:        z.string(),
});

export const formacionConsagracionSchema = z.object({
  anio:         z.number().int().min(2020).max(2100),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
});

export const leccionConsagracionSchema = z.object({
  numero: z.number().int().min(1).max(35),
  tipo:   z.enum(['leccion', 'retiro']),
  fecha:  z.string(),
});

export type InscripcionConsagracionInput = z.infer<typeof inscripcionConsagracionSchema>;
export type FormacionConsagracionInput = z.infer<typeof formacionConsagracionSchema>;
export type LeccionConsagracionInput = z.infer<typeof leccionConsagracionSchema>;
