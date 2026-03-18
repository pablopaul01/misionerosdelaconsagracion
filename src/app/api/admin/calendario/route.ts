import { NextRequest, NextResponse } from 'next/server';
import { CALENDARIO_ORIGEN } from '@/lib/constants/calendario';
import { createAdminClient } from '@/lib/supabase/server';
import { assertAdminSession } from '@/lib/server/admin-auth';
import {
  actividadFiltroAdminSchema,
  actividadManualSchema,
} from '@/lib/validations/calendario';

export async function GET(request: NextRequest) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = actividadFiltroAdminSchema.safeParse({
    origen_tipo: searchParams.get('origen_tipo') ?? undefined,
    estado: searchParams.get('estado') ?? undefined,
    tipo: searchParams.get('tipo') ?? undefined,
    desde: searchParams.get('desde') ?? undefined,
    hasta: searchParams.get('hasta') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const admin = createAdminClient();

  let query = admin
    .from('calendario_actividades')
    .select('*')
    .order('fecha_inicio', { ascending: true })
    .limit(250);

  const { origen_tipo: origenTipo, estado, tipo, desde, hasta } = parsed.data;

  if (origenTipo) {
    query = query.eq('origen_tipo', origenTipo);
  }
  if (estado) {
    query = query.eq('estado', estado);
  }
  if (tipo) {
    query = query.ilike('tipo', `%${tipo}%`);
  }
  if (desde) {
    query = query.gte('fecha_inicio', desde);
  }
  if (hasta) {
    query = query.lte('fecha_inicio', hasta);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'No se pudo obtener el calendario' }, { status: 500 });
  }

  return NextResponse.json({ actividades: data ?? [] });
}

export async function POST(request: NextRequest) {
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

  const parsed = actividadManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('calendario_actividades')
    .insert({
      ...parsed.data,
      origen_tipo: CALENDARIO_ORIGEN.MANUAL,
      sincronizado: false,
      origen_id: null,
      origen_updated_at: null,
      dedupe_key: null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'No se pudo crear la actividad' }, { status: 500 });
  }

  return NextResponse.json({ actividad: data }, { status: 201 });
}
