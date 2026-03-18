import type { SupabaseClient } from '@supabase/supabase-js';
import { CALENDARIO_ESTADO, CALENDARIO_ORIGEN, type CalendarioOrigen } from '@/lib/constants/calendario';
import type { Database } from '@/types/supabase';

type CalendarioClient = SupabaseClient<Database>;

type SyncInput = {
  origenTipo: Exclude<CalendarioOrigen, 'manual'>;
  origenId: string;
  origenUpdatedAt: string;
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string | null;
};

export const buildCalendarioDedupeKey = (origenTipo: SyncInput['origenTipo'], origenId: string) => {
  switch (origenTipo) {
    case CALENDARIO_ORIGEN.CONSAGRACION_FORMACION:
      return `consagracion-formacion:${origenId}:inicio`;
    case CALENDARIO_ORIGEN.CONSAGRACION_RETIRO:
      return `consagracion-retiro:${origenId}:fecha`;
    case CALENDARIO_ORIGEN.RETIRO:
      return `retiro:${origenId}:inicio`;
    case CALENDARIO_ORIGEN.FORMACION_MISIONEROS:
      return `formacion-misioneros:${origenId}:inicio`;
    default:
      return `${origenTipo}:${origenId}`;
  }
};

export const upsertActividadSincronizada = async (supabase: CalendarioClient, input: SyncInput) => {
  const dedupeKey = buildCalendarioDedupeKey(input.origenTipo, input.origenId);

  const { data: existente, error: existenteError } = await supabase
    .from('calendario_actividades')
    .select('id, origen_updated_at')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();

  if (existenteError) throw existenteError;

  if (existente?.origen_updated_at) {
    const incoming = new Date(input.origenUpdatedAt).getTime();
    const current = new Date(existente.origen_updated_at).getTime();
    if (Number.isFinite(incoming) && Number.isFinite(current) && incoming < current) {
      return existente;
    }
  }

  const payload: Database['public']['Tables']['calendario_actividades']['Insert'] = {
    titulo: input.titulo,
    descripcion: input.descripcion ?? null,
    tipo: input.tipo,
    estado: CALENDARIO_ESTADO.ACTIVO,
    fecha_inicio: input.fechaInicio,
    fecha_fin: input.fechaFin ?? null,
    origen_tipo: input.origenTipo,
    origen_id: input.origenId,
    origen_updated_at: input.origenUpdatedAt,
    dedupe_key: dedupeKey,
    sincronizado: true,
  };

  const { data, error } = await supabase
    .from('calendario_actividades')
    .upsert(payload, { onConflict: 'dedupe_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const desactivarActividadSincronizada = async (
  supabase: CalendarioClient,
  origenTipo: Exclude<CalendarioOrigen, 'manual'>,
  origenId: string,
) => {
  const dedupeKey = buildCalendarioDedupeKey(origenTipo, origenId);

  const { error } = await supabase
    .from('calendario_actividades')
    .update({ estado: CALENDARIO_ESTADO.CANCELADO })
    .eq('dedupe_key', dedupeKey);

  if (error) throw error;
};
