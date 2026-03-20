'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface ClaseActiva {
  id: string;
  numero: number;
  fecha: string;
  formacion: {
    tipo: 'san_lorenzo' | 'escuela_de_maria';
    anio: number;
  };
}

export interface MisioneroEncontrado {
  id: string;
  nombre: string;
  apellido: string;
}

export type BuscarMisioneroResult =
  | { ok: false; error: string }
  | { ok: true; misionero: MisioneroEncontrado; estado: 'sin-clase' }
  | { ok: true; misionero: MisioneroEncontrado; estado: 'ya-registrado' }
  | { ok: true; misionero: MisioneroEncontrado; estado: 'confirmar'; clase: ClaseActiva };

export async function buscarMisioneroFormacion(dni: string): Promise<BuscarMisioneroResult> {
  const supabase = createAdminClient();

  const { data: misioneroData, error: misioneroError } = await supabase
    .from('misioneros')
    .select('id, nombre, apellido')
    .eq('dni', dni.trim())
    .single();

  if (misioneroError || !misioneroData) {
    return { ok: false, error: 'No encontramos un misionero con ese DNI' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clasesActivas } = await (supabase as any)
    .from('clases')
    .select('id, numero, fecha, formaciones_misioneros!inner(tipo, anio, inscripciones_misioneros!inner(misionero_id))')
    .eq('activa', true)
    .eq('formaciones_misioneros.inscripciones_misioneros.misionero_id', misioneroData.id);

  const clase = clasesActivas?.[0];

  if (!clase) {
    return { ok: true, misionero: misioneroData, estado: 'sin-clase' };
  }

  const { data: asistenciaExistente } = await supabase
    .from('asistencias_misioneros')
    .select('id')
    .eq('clase_id', clase.id)
    .eq('misionero_id', misioneroData.id)
    .single();

  if (asistenciaExistente) {
    return { ok: true, misionero: misioneroData, estado: 'ya-registrado' };
  }

  const formacion = clase.formaciones_misioneros as { tipo: 'san_lorenzo' | 'escuela_de_maria'; anio: number };

  return {
    ok: true,
    misionero: misioneroData,
    estado: 'confirmar',
    clase: { id: clase.id, numero: clase.numero, fecha: clase.fecha, formacion },
  };
}

export async function registrarAsistenciaFormacion(
  misioneroId: string,
  claseId: string,
  asistio: boolean,
  motivoAusencia?: string,
): Promise<{ ok: boolean }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('asistencias_misioneros').insert({
    clase_id: claseId,
    misionero_id: misioneroId,
    asistio,
    motivo_ausencia: asistio ? null : (motivoAusencia || null),
  });

  return { ok: !error };
}
