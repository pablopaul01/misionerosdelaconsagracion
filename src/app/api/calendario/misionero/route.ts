import { NextRequest, NextResponse } from 'next/server';
import { CALENDARIO_MAX_RESULTADOS } from '@/lib/constants/calendario';
import { createAdminClient } from '@/lib/supabase/server';
import { consultaCalendarioDniSchema } from '@/lib/validations/calendario';
import { consumeRateLimit } from '@/lib/utils/rate-limit';

const MESSAGE_NEUTRAL = 'No encontramos actividades para los datos ingresados.';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
  }

  const parsed = consultaCalendarioDniSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const rate = consumeRateLimit({
    key: `dni:${ip}:${parsed.data.dni}`,
    limit: 8,
    windowMs: 60_000,
  });

  if (!rate.ok) {
    return NextResponse.json({ error: 'Limite de consultas alcanzado. Intenta nuevamente en breve.' }, { status: 429 });
  }

  const admin = createAdminClient();

  let misionero;
  try {
    const result = await admin
      .from('misioneros')
      .select('id')
      .eq('dni', parsed.data.dni)
      .eq('activo', true)
      .maybeSingle();

    if (result.error) {
      return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
    }
    misionero = result.data;
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
  }

  if (!misionero) {
    return NextResponse.json({ actividades: [], message: MESSAGE_NEUTRAL }, { status: 404 });
  }

  let actividades;
  try {
    const result = await admin
      .from('calendario_actividades')
      .select('id, titulo, descripcion, fecha_inicio, fecha_fin, tipo, origen_tipo')
      .eq('estado', 'activo')
      .gte('fecha_inicio', parsed.data.desde)
      .lte('fecha_inicio', parsed.data.hasta)
      .order('fecha_inicio', { ascending: true })
      .limit(CALENDARIO_MAX_RESULTADOS);

    if (result.error) {
      return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
    }
    actividades = result.data;
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
  }

  return NextResponse.json({
    actividades: actividades ?? [],
    message: (actividades?.length ?? 0) > 0 ? null : MESSAGE_NEUTRAL,
  });
}
