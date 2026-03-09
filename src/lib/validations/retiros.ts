import { z } from 'zod';
import {
  ESTADO_CIVIL_LABEL,
  ESTADO_RELACION_LABEL,
  type EstadoRelacion,
  type EstadoCivil,
} from '@/lib/constants/retiros';

// ============ CONTACTO DE EMERGENCIA ============

export const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  whatsapp: z.string().min(8, 'WhatsApp inválido').regex(/^\d+$/, 'Solo números'),
  relacion: z.string().min(1, 'Relación requerida'),
});

export type ContactoEmergencia = z.infer<typeof contactoEmergenciaSchema>;

// ============ RETIRO (crear/editar) ============

export const retiroSchema = z.object({
  tipo: z.enum(['conversion', 'matrimonios', 'misioneros'] as const),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string(),
  imagen_url: z.string(),
  fecha_inicio: z.string().min(1, 'Fecha inicio requerida'),
  fecha_fin: z.string().min(1, 'Fecha fin requerida'),
  lugar: z.string().min(1, 'Lugar requerido'),
  costo: z.number().min(0, 'El costo no puede ser negativo'),
  cupo: z.number().int().positive().nullable(),
  activo: z.boolean(),
});

export type RetiroInput = z.infer<typeof retiroSchema>;

// ============ INSCRIPCIÓN CONVERSIÓN ============

// Configuración de campos para formulario dinámico (secciones colapsables)
export const CONVERSION_FIELDS = [
  // Sección 1: Datos personales
  { name: 'nombre', label: 'Nombre', type: 'text', required: true, section: 1 },
  { name: 'apellido', label: 'Apellido', type: 'text', required: true, section: 1 },
  { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: false, section: 1 },
  { name: 'dni', label: 'DNI', type: 'tel', required: true, section: 1 },
  {
    name: 'estado_civil',
    label: 'Estado civil',
    type: 'select',
    required: false,
    section: 1,
    options: (Object.entries(ESTADO_CIVIL_LABEL) as [EstadoCivil, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  },
  { name: 'domicilio', label: 'Domicilio', type: 'text', required: false, section: 1 },
  { name: 'telefono', label: 'Teléfono', type: 'tel', required: true, section: 1 },

  // Sección 2: Contactos de emergencia (widget custom)
  { name: 'contactos_emergencia', label: 'Contactos de emergencia', type: 'contactos', required: true, section: 2 },

  // Sección 3: Salud
  { name: 'tiene_enfermedad', label: '¿Padecés alguna enfermedad o alergia?', type: 'boolean', required: true, section: 3 },
  { name: 'enfermedad_detalle', label: 'Especificar', type: 'text', required: false, section: 3, showIf: 'tiene_enfermedad' },
  { name: 'tiene_dieta_especial', label: '¿Realizás alguna dieta especial por prescripción médica?', type: 'boolean', required: true, section: 3 },
  { name: 'dieta_especial_detalle', label: 'Especificar', type: 'text', required: false, section: 3, showIf: 'tiene_dieta_especial' },

  // Sección 4: Info del retiro
  { name: 'primer_retiro', label: '¿Es tu primer retiro?', type: 'boolean', required: true, section: 4 },
  { name: 'bautizado', label: '¿Recibiste el sacramento del Bautismo?', type: 'boolean', required: true, section: 4 },
] as const;

export const inscripcionConversionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  dni: z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  estado_civil: z.string().min(1, 'El estado civil es requerido'),
  domicilio: z.string().min(1, 'El domicilio es requerido'),
  telefono: z.string().min(8, 'Teléfono inválido').regex(/^\d+$/, 'Solo números'),
  contactos_emergencia: z.array(contactoEmergenciaSchema).length(3, 'Debe ingresar 3 contactos'),
  tiene_enfermedad: z.boolean(),
  enfermedad_detalle: z.string(),
  tiene_dieta_especial: z.boolean(),
  dieta_especial_detalle: z.string(),
  primer_retiro: z.boolean(),
  bautizado: z.boolean(),
}).refine(
  (data) => !data.tiene_enfermedad || (data.tiene_enfermedad && data.enfermedad_detalle.length > 0),
  { message: 'Especificá la enfermedad o alergia', path: ['enfermedad_detalle'] }
).refine(
  (data) => !data.tiene_dieta_especial || (data.tiene_dieta_especial && data.dieta_especial_detalle.length > 0),
  { message: 'Especificá la dieta especial', path: ['dieta_especial_detalle'] }
);

export type InscripcionConversionInput = z.infer<typeof inscripcionConversionSchema>;

// ============ INSCRIPCIÓN MATRIMONIOS ============

// Configuración de campos para formulario dinámico
export const MATRIMONIOS_FIELDS = [
  // Sección 1: Datos del esposo
  { name: 'nombre_esposo', label: 'Nombre', type: 'text', required: true, section: 1 },
  { name: 'apellido_esposo', label: 'Apellido', type: 'text', required: true, section: 1 },
  { name: 'dni_esposo', label: 'DNI', type: 'tel', required: true, section: 1 },
  { name: 'fecha_nacimiento_esposo', label: 'Fecha de nacimiento', type: 'date', required: false, section: 1 },
  { name: 'whatsapp_esposo', label: 'WhatsApp', type: 'tel', required: true, section: 1 },

  // Sección 2: Datos de la esposa
  { name: 'nombre_esposa', label: 'Nombre', type: 'text', required: true, section: 2 },
  { name: 'apellido_esposa', label: 'Apellido', type: 'text', required: true, section: 2 },
  { name: 'dni_esposa', label: 'DNI', type: 'tel', required: true, section: 2 },
  { name: 'fecha_nacimiento_esposa', label: 'Fecha de nacimiento', type: 'date', required: false, section: 2 },
  { name: 'whatsapp_esposa', label: 'WhatsApp', type: 'tel', required: true, section: 2 },

  // Sección 3: Datos de la pareja
  {
    name: 'estado_relacion',
    label: 'Estado de la relación',
    type: 'select',
    required: true,
    section: 3,
    options: (Object.entries(ESTADO_RELACION_LABEL) as [EstadoRelacion, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  },
  { name: 'domicilio', label: 'Domicilio', type: 'text', required: false, section: 3 },
  { name: 'como_se_enteraron', label: '¿Cómo se enteraron del retiro?', type: 'textarea', required: false, section: 3 },
] as const;

export const inscripcionMatrimoniosSchema = z.object({
  nombre_esposo: z.string().min(1, 'El nombre es requerido'),
  apellido_esposo: z.string().min(1, 'El apellido es requerido'),
  dni_esposo: z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  fecha_nacimiento_esposo: z.string().min(1, 'La fecha de nacimiento es requerida'),
  whatsapp_esposo: z.string().min(8, 'WhatsApp inválido').regex(/^\d+$/, 'Solo números'),

  nombre_esposa: z.string().min(1, 'El nombre es requerido'),
  apellido_esposa: z.string().min(1, 'El apellido es requerido'),
  dni_esposa: z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  fecha_nacimiento_esposa: z.string().min(1, 'La fecha de nacimiento es requerida'),
  whatsapp_esposa: z.string().min(8, 'WhatsApp inválido').regex(/^\d+$/, 'Solo números'),

  estado_relacion: z.enum(['union_libre', 'casados', 'comprometidos', 'novios'] as const, {
    message: 'Seleccioná el estado de la relación',
  }),
  domicilio: z.string().min(1, 'El domicilio es requerido'),
  como_se_enteraron: z.string().min(1, 'Contanos cómo se enteraron del retiro'),
});

export type InscripcionMatrimoniosInput = z.infer<typeof inscripcionMatrimoniosSchema>;

// ============ PAGO ============

export const pagoSchema = z.object({
  monto: z.number().min(0, 'El monto no puede ser negativo'),
  metodo: z.enum(['efectivo', 'transferencia', 'tarjeta'] as const, {
    message: 'Seleccioná un método de pago',
  }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  notas: z.string(),
});

export type PagoInput = z.infer<typeof pagoSchema>;

// ============ ROL DE SERVIDOR ============

export const rolServidorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string(),
  activo: z.boolean(),
});

export type RolServidorInput = z.infer<typeof rolServidorSchema>;

// ============ SERVIDOR ============

export const servidorSchema = z.object({
  misionero_id: z.string().uuid('Seleccioná un misionero'),
  rol_id: z.string().uuid('Seleccioná un rol'),
  notas: z.string(),
});

export type ServidorInput = z.infer<typeof servidorSchema>;

// ============ COMPRA ============

export const compraSchema = z.object({
  concepto: z.string().min(1, 'El concepto es requerido'),
  cantidad: z.number().positive('La cantidad debe ser positiva').nullable(),
  unidad: z.string(),
  costo: z.number().min(0, 'El costo no puede ser negativo').nullable(),
  comprado: z.boolean(),
});

export type CompraInput = z.infer<typeof compraSchema>;

// ============ HELPERS ============

// Valores por defecto para formulario de conversión
export const defaultInscripcionConversion: InscripcionConversionInput = {
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  dni: '',
  estado_civil: '',
  domicilio: '',
  telefono: '',
  contactos_emergencia: [
    { nombre: '', whatsapp: '', relacion: '' },
    { nombre: '', whatsapp: '', relacion: '' },
    { nombre: '', whatsapp: '', relacion: '' },
  ],
  tiene_enfermedad: false,
  enfermedad_detalle: '',
  tiene_dieta_especial: false,
  dieta_especial_detalle: '',
  primer_retiro: true,
  bautizado: false,
};

// Valores por defecto para formulario de matrimonios
export const defaultInscripcionMatrimonios: InscripcionMatrimoniosInput = {
  nombre_esposo: '',
  apellido_esposo: '',
  dni_esposo: '',
  fecha_nacimiento_esposo: '',
  whatsapp_esposo: '',
  nombre_esposa: '',
  apellido_esposa: '',
  dni_esposa: '',
  fecha_nacimiento_esposa: '',
  whatsapp_esposa: '',
  estado_relacion: 'novios',
  domicilio: '',
  como_se_enteraron: '',
};

// Valores por defecto para retiro
export const defaultRetiro: RetiroInput = {
  tipo: 'conversion',
  nombre: '',
  descripcion: '',
  imagen_url: '',
  fecha_inicio: '',
  fecha_fin: '',
  lugar: '',
  costo: 0,
  cupo: null,
  activo: true,
};

// Valores por defecto para pago
export const defaultPago: PagoInput = {
  monto: 0,
  metodo: 'efectivo',
  fecha: new Date().toISOString().split('T')[0],
  notas: '',
};

// Valores por defecto para compra
export const defaultCompra: CompraInput = {
  concepto: '',
  cantidad: null,
  unidad: '',
  costo: null,
  comprado: false,
};
