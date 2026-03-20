'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface GrupoActivo {
  id: string;
  fecha: string;
}

export interface MisioneroEncontrado {
  id: string;
  nombre: string;
  apellido: string;
}

export type BuscarMisioneroGrupoResult =
  | { ok: false; error: string }
  | { ok: true; estado: 'sin-grupo' }
  | { ok: true; estado: 'ya-registrado'; misionero: MisioneroEncontrado; grupo: GrupoActivo }
  | { ok: true; estado: 'confirmar'; misionero: MisioneroEncontrado; grupo: GrupoActivo };

export async function buscarMisioneroGrupo(dni: string): Promise<BuscarMisioneroGrupoResult> {
  const supabase = createAdminClient();

  const { data: grupo, error: grupoError } = await supabase
    .from('grupos_oracion')
    .select('id, fecha')
    .eq('activa', true)
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  if (grupoError || !grupo) {
    return { ok: true, estado: 'sin-grupo' };
  }

  const { data: misioneroData, error: misioneroError } = await supabase
    .from('misioneros')
    .select('id, nombre, apellido')
    .eq('dni', dni.trim())
    .single();

  if (misioneroError || !misioneroData) {
    return { ok: false, error: 'No encontramos un misionero con ese DNI' };
  }

  const { data: asistenciaExistente } = await supabase
    .from('asistencias_grupo_oracion')
    .select('id')
    .eq('grupo_id', grupo.id)
    .eq('misionero_id', misioneroData.id)
    .single();

  if (asistenciaExistente) {
    return { ok: true, estado: 'ya-registrado', misionero: misioneroData, grupo };
  }

  return { ok: true, estado: 'confirmar', misionero: misioneroData, grupo };
}

export async function registrarAsistenciaGrupo(
  misioneroId: string,
  grupoId: string,
): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('asistencias_grupo_oracion').insert({
    grupo_id: grupoId,
    misionero_id: misioneroId,
    asistio: true,
  });

  return { ok: !error };
}
