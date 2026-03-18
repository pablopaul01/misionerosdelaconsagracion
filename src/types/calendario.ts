import { CALENDARIO_ORIGEN } from '@/lib/constants/calendario';

export type CalendarioEstado = 'activo' | 'cancelado';

export type ActividadCalendario = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  origen_tipo: (typeof CALENDARIO_ORIGEN)[keyof typeof CALENDARIO_ORIGEN];
  estado: CalendarioEstado;
  origen_id: string | null;
  sincronizado: boolean;
  dedupe_key: string | null;
  nota_admin: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CalendarioEventInput = {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    tipo: string;
    origen_tipo: string;
    descripcion: string | null;
    estado: CalendarioEstado;
  };
};

export const CALENDARIO_COLORS: Record<(typeof CALENDARIO_ORIGEN)[keyof typeof CALENDARIO_ORIGEN], { bg: string; border: string; text: string }> = {
  [CALENDARIO_ORIGEN.MANUAL]: { bg: '#F5E6D3', border: '#8B5A2B', text: '#5C3D1E' },
  [CALENDARIO_ORIGEN.CONSAGRACION_FORMACION]: { bg: '#E8EEF4', border: '#1E3A5F', text: '#1E3A5F' },
  [CALENDARIO_ORIGEN.CONSAGRACION_RETIRO]: { bg: '#E3EBF3', border: '#2C4A6E', text: '#2C4A6E' },
  [CALENDARIO_ORIGEN.RETIRO]: { bg: '#FDF6E3', border: '#C9A84C', text: '#8B7314' },
  [CALENDARIO_ORIGEN.FORMACION_MISIONEROS]: { bg: '#F5EDE6', border: '#8B7355', text: '#5C4A35' },
};

export const toCalendarEvent = (actividad: ActividadCalendario): CalendarioEventInput => {
  const colors = CALENDARIO_COLORS[actividad.origen_tipo] ?? CALENDARIO_COLORS[CALENDARIO_ORIGEN.MANUAL];

  return {
    id: actividad.id,
    title: actividad.titulo,
    start: actividad.fecha_inicio,
    end: actividad.fecha_fin,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    extendedProps: {
      tipo: actividad.tipo,
      origen_tipo: actividad.origen_tipo,
      descripcion: actividad.descripcion,
      estado: actividad.estado,
    },
  };
};
