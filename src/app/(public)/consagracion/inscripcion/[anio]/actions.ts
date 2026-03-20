'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { INSCRIPCION_ESTADO, CONTACTO_ESTADO } from '@/lib/constants/consagracion';
import type { InscripcionConsagracionInput } from '@/lib/validations/consagracion';

export async function getFormacionByAnio(anio: number) {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('formaciones_consagracion')
    .select('id, anio, activa')
    .eq('anio', anio)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; anio: number; activa: boolean };
}

export async function crearInscripcionConsagracion(
  formacionId: string,
  input: InscripcionConsagracionInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('inscripciones_consagracion').insert({
    ...input,
    formacion_id: formacionId,
    estado_inscripcion: INSCRIPCION_ESTADO.INSCRIPTO,
    estado_contacto: input.estado_contacto ?? CONTACTO_ESTADO.PENDIENTE,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
