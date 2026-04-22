import { NextRequest, NextResponse } from 'next/server';
import { CALENDARIO_MAX_RESULTADOS } from '@/lib/constants/calendario';
import { CALENDARIO_ORIGEN_CUMPLEANIOS_MISIONERO } from '@/lib/constants/calendario';
import { createAdminClient } from '@/lib/supabase/server';
import { consultaCalendarioDniSchema } from '@/lib/validations/calendario';
import { consumeRateLimit } from '@/lib/utils/rate-limit';
import type { ActividadCalendario } from '@/types/calendario';
import type { Database } from '@/types/supabase';

const MESSAGE_NEUTRAL = 'No encontramos actividades para los datos ingresados.';
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type MisioneroCumple = Pick<Database['public']['Tables']['misioneros']['Row'], 'id' | 'nombre' | 'apellido' | 'fecha_nacimiento'>;

const isLeapYear = (year: number): boolean => year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

const toCumpleaniosDateInYear = (fechaNacimiento: string, year: number): string | null => {
  if (!DATE_ONLY_REGEX.test(fechaNacimiento)) {
    return null;
  }

  const [, monthText, dayText] = fechaNacimiento.split('-');
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return `${year}-03-01`;
  }

  const monthIndex = month - 1;
  const date = new Date(Date.UTC(year, monthIndex, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const buildCumpleaniosEventos = ({
  misioneros,
  desde,
  hasta,
}: {
  misioneros: MisioneroCumple[];
  desde: string;
  hasta: string;
}): ActividadCalendario[] => {
  const desdeYear = Number(desde.slice(0, 4));
  const hastaYear = Number(hasta.slice(0, 4));

  if (!Number.isInteger(desdeYear) || !Number.isInteger(hastaYear) || hastaYear < desdeYear) {
    return [];
  }

  const years = Array.from({ length: hastaYear - desdeYear + 1 }, (_, index) => desdeYear + index);

  return misioneros.flatMap((misionero) => {
    const fechaNacimiento = misionero.fecha_nacimiento;
    if (!fechaNacimiento) {
      return [];
    }

    const nombreCompleto = [misionero.nombre, misionero.apellido].filter(Boolean).join(' ').trim();

    return years.flatMap((year) => {
      const fechaCumple = toCumpleaniosDateInYear(fechaNacimiento, year);
      if (!fechaCumple || fechaCumple < desde || fechaCumple > hasta) {
        return [];
      }

      return [
        {
          id: `cumpleanios-${misionero.id}-${fechaCumple}`,
          titulo: `Cumpleaños: ${nombreCompleto || 'Misionero'}`,
          descripcion: null,
          fecha_inicio: fechaCumple,
          fecha_fin: null,
          tipo: 'Cumpleaños',
          origen_tipo: CALENDARIO_ORIGEN_CUMPLEANIOS_MISIONERO,
          estado: 'activo',
          origen_id: misionero.id,
          sincronizado: false,
          dedupe_key: null,
          nota_admin: null,
          created_at: null,
          updated_at: null,
        },
      ];
    });
  });
};

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

  let actividades: ActividadCalendario[] = [];
  try {
    const result = await admin
      .from('calendario_actividades')
      .select('id, titulo, descripcion, fecha_inicio, fecha_fin, tipo, origen_tipo, estado, origen_id, sincronizado, dedupe_key, nota_admin, created_at, updated_at')
      .eq('estado', 'activo')
      .gte('fecha_inicio', parsed.data.desde)
      .lte('fecha_inicio', parsed.data.hasta)
      .order('fecha_inicio', { ascending: true })
      .limit(CALENDARIO_MAX_RESULTADOS);

    if (result.error) {
      return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
    }
    actividades = result.data ?? [];
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
  }

  let cumpleaniosEventos: ActividadCalendario[] = [];
  try {
    const result = await admin
      .from('misioneros')
      .select('id, nombre, apellido, fecha_nacimiento')
      .eq('activo', true)
      .not('fecha_nacimiento', 'is', null);

    if (result.error) {
      return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
    }

    cumpleaniosEventos = buildCumpleaniosEventos({
      misioneros: result.data ?? [],
      desde: parsed.data.desde,
      hasta: parsed.data.hasta,
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo consultar el calendario' }, { status: 500 });
  }

  const actividadesCombinadas = [...actividades, ...cumpleaniosEventos].sort((left, right) =>
    left.fecha_inicio.localeCompare(right.fecha_inicio),
  );

  return NextResponse.json({
    actividades: actividadesCombinadas,
    message: actividadesCombinadas.length > 0 ? null : MESSAGE_NEUTRAL,
  });
}
