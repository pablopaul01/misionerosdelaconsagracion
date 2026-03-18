import { NextRequest, NextResponse } from 'next/server';
import { CALENDARIO_ORIGEN } from '@/lib/constants/calendario';
import { createAdminClient } from '@/lib/supabase/server';
import { assertAdminSession } from '@/lib/server/admin-auth';
import {
  actividadUpdateSchema,
  actividadUpdateSincronizadaSchema,
} from '@/lib/validations/calendario';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: actividad, error: actividadError } = await admin
    .from('calendario_actividades')
    .select('id, origen_tipo')
    .eq('id', params.id)
    .maybeSingle();

  if (actividadError || !actividad) {
    return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
  }

  const isManual = actividad.origen_tipo === CALENDARIO_ORIGEN.MANUAL;
  const parsed = isManual
    ? actividadUpdateSchema.safeParse(body)
    : actividadUpdateSincronizadaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await admin
    .from('calendario_actividades')
    .update(parsed.data)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'No se pudo actualizar la actividad' }, { status: 500 });
  }

  return NextResponse.json({ actividad: data });
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  const { data: actividad, error: actividadError } = await admin
    .from('calendario_actividades')
    .select('id, origen_tipo')
    .eq('id', params.id)
    .maybeSingle();

  if (actividadError || !actividad) {
    return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
  }

  if (actividad.origen_tipo !== CALENDARIO_ORIGEN.MANUAL) {
    const { error: deactivateError } = await admin
      .from('calendario_actividades')
      .update({ estado: 'cancelado' })
      .eq('id', params.id);

    if (deactivateError) {
      return NextResponse.json({ error: 'No se pudo desactivar la actividad' }, { status: 500 });
    }

    return NextResponse.json({ success: true, mode: 'deactivate' });
  }

  const { error } = await admin.from('calendario_actividades').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la actividad' }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: 'delete' });
}
