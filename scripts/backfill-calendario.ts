/**
 * Script de backfill: sincroniza TODOS los registros existentes de las 4 tablas origen
 * hacia calendario_actividades, usando dedupe_key para evitar duplicados.
 *
 * Uso: pnpm backfill:calendario
 * Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { CALENDARIO_ORIGEN } from '../src/lib/constants/calendario';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createSupabaseClient>;

type SyncResult = {
  origin: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
};

type UpsertPayload = {
  titulo: string;
  descripcion: string | null;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  origen_tipo: string;
  origen_id: string;
  origen_updated_at: string;
  dedupe_key: string;
};

const buildDedupeKey = (origenTipo: string, origenId: string) => {
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

type SyncStatus = 'created' | 'updated' | 'skipped' | 'error';

const syncSingle = async (
  supabase: SupabaseAdmin,
  dedupeKey: string,
  origenUpdatedAt: string,
  payload: UpsertPayload,
): Promise<SyncStatus> => {
  const { data: existente } = await supabase
    .from('calendario_actividades')
    .select('id, origen_updated_at')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();

  if (existente) {
    const incomingTs = new Date(origenUpdatedAt).getTime();
    const currentTs = existente.origen_updated_at
      ? new Date(existente.origen_updated_at).getTime()
      : 0;
    if (Number.isFinite(incomingTs) && incomingTs <= currentTs) {
      return 'skipped';
    }
    const { error } = await supabase
      .from('calendario_actividades')
      .update({ ...payload, sincronizado: true })
      .eq('dedupe_key', dedupeKey);
    if (error) throw error;
    return 'updated';
  }

  const { error } = await supabase
    .from('calendario_actividades')
    .upsert({ ...payload, sincronizado: true }, { onConflict: 'dedupe_key' });
  if (error) throw error;
  return 'created';
};

const incrementStatus = (result: SyncResult, status: SyncStatus) => {
  if (status === 'created') result.created++;
  else if (status === 'updated') result.updated++;
  else if (status === 'skipped') result.skipped++;
  else result.errors++;
};

const addError = (result: SyncResult, key: string, e: unknown) => {
  result.errors++;
  result.errorDetails.push(`${key}: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
};

// Origen 1: formaciones_consagracion
const backfillConsagracionFormaciones = async (supabase: SupabaseAdmin): Promise<SyncResult> => {
  const result: SyncResult = { origin: 'consagracion_formacion', created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('formaciones_consagracion').select('id, anio, fecha_inicio, created_at') as any);
  if (error || !data) {
    result.errors++;
    result.errorDetails.push(`fetch: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  if (data.length === 0) { console.log('  [SKIP] No formaciones_consagracion'); return result; }

  for (const f of data) {
    if (!f.fecha_inicio) { result.skipped++; continue; }
    const dedupeKey = buildDedupeKey(CALENDARIO_ORIGEN.CONSAGRACION_FORMACION, f.id);
    const payload: UpsertPayload = {
      titulo: `Consagracion ${f.anio}`,
      descripcion: 'Inicio de formacion de consagracion.',
      tipo: 'consagracion',
      fecha_inicio: f.fecha_inicio,
      fecha_fin: null,
      origen_tipo: CALENDARIO_ORIGEN.CONSAGRACION_FORMACION,
      origen_id: f.id,
      origen_updated_at: f.created_at ?? new Date().toISOString(),
      dedupe_key: dedupeKey,
    };
    try {
      const status = await syncSingle(supabase, dedupeKey, f.created_at ?? new Date().toISOString(), payload);
      incrementStatus(result, status);
    } catch (e) { addError(result, dedupeKey, e); }
  }
  return result;
};

// Origen 2: lecciones_consagracion (tipo=retiro)
const backfillConsagracionRetiros = async (supabase: SupabaseAdmin): Promise<SyncResult> => {
  const result: SyncResult = { origin: 'consagracion_retiro', created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('lecciones_consagracion').select('id, numero, fecha, created_at').eq('tipo', 'retiro') as any);
  if (error || !data) {
    result.errors++;
    result.errorDetails.push(`fetch: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  if (data.length === 0) { console.log('  [SKIP] No lecciones_consagracion (tipo=retiro)'); return result; }

  for (const l of data) {
    if (!l.fecha) { result.skipped++; continue; }
    const dedupeKey = buildDedupeKey(CALENDARIO_ORIGEN.CONSAGRACION_RETIRO, l.id);
    const payload: UpsertPayload = {
      titulo: `Retiro de consagracion #${l.numero}`,
      descripcion: 'Retiro dentro de la formacion de consagracion.',
      tipo: 'retiro',
      fecha_inicio: l.fecha,
      fecha_fin: null,
      origen_tipo: CALENDARIO_ORIGEN.CONSAGRACION_RETIRO,
      origen_id: l.id,
      origen_updated_at: l.created_at ?? new Date().toISOString(),
      dedupe_key: dedupeKey,
    };
    try {
      const status = await syncSingle(supabase, dedupeKey, l.created_at ?? new Date().toISOString(), payload);
      incrementStatus(result, status);
    } catch (e) { addError(result, dedupeKey, e); }
  }
  return result;
};

// Origen 3: retiros
const backfillRetiros = async (supabase: SupabaseAdmin): Promise<SyncResult> => {
  const result: SyncResult = { origin: 'retiro', created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('retiros').select('id, nombre, tipo, descripcion, fecha_inicio, fecha_fin, created_at, updated_at') as any);
  if (error || !data) {
    result.errors++;
    result.errorDetails.push(`fetch: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  if (data.length === 0) { console.log('  [SKIP] No retiros'); return result; }

  for (const r of data) {
    if (!r.fecha_inicio) { result.skipped++; continue; }
    const origenUpdatedAt = r.updated_at ?? r.created_at ?? new Date().toISOString();
    const dedupeKey = buildDedupeKey(CALENDARIO_ORIGEN.RETIRO, r.id);
    const payload: UpsertPayload = {
      titulo: r.nombre,
      descripcion: r.descripcion,
      tipo: r.tipo,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      origen_tipo: CALENDARIO_ORIGEN.RETIRO,
      origen_id: r.id,
      origen_updated_at: origenUpdatedAt,
      dedupe_key: dedupeKey,
    };
    try {
      const status = await syncSingle(supabase, dedupeKey, origenUpdatedAt, payload);
      incrementStatus(result, status);
    } catch (e) { addError(result, dedupeKey, e); }
  }
  return result;
};

// Origen 4: formaciones_misioneros
const backfillFormacionesMisioneros = async (supabase: SupabaseAdmin): Promise<SyncResult> => {
  const result: SyncResult = { origin: 'formacion_misioneros', created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('formaciones_misioneros').select('id, anio, tipo, fecha_inicio, created_at') as any);
  if (error || !data) {
    result.errors++;
    result.errorDetails.push(`fetch: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  if (data.length === 0) { console.log('  [SKIP] No formaciones_misioneros'); return result; }

  for (const fm of data) {
    if (!fm.fecha_inicio) { result.skipped++; continue; }
    const dedupeKey = buildDedupeKey(CALENDARIO_ORIGEN.FORMACION_MISIONEROS, fm.id);
    const payload: UpsertPayload = {
      titulo: `Formacion ${fm.anio} - ${fm.tipo}`,
      descripcion: 'Inicio de formacion para misioneros.',
      tipo: 'formacion',
      fecha_inicio: fm.fecha_inicio,
      fecha_fin: null,
      origen_tipo: CALENDARIO_ORIGEN.FORMACION_MISIONEROS,
      origen_id: fm.id,
      origen_updated_at: fm.created_at ?? new Date().toISOString(),
      dedupe_key: dedupeKey,
    };
    try {
      const status = await syncSingle(supabase, dedupeKey, fm.created_at ?? new Date().toISOString(), payload);
      incrementStatus(result, status);
    } catch (e) { addError(result, dedupeKey, e); }
  }
  return result;
};

const main = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('\n=== BACKFILL CALENDARIO: sincronizando 4 origines ===\n');

  const supabase = createSupabaseClient(url, serviceKey);

  // Count before
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalBefore } = await (supabase.from('calendario_actividades').select('id', { count: 'exact', head: true }) as any);
  console.log(`Actividades antes: ${totalBefore ?? 0}\n`);

  const [consagracionFormaciones, consagracionRetiros, retiros, formacionesMisioneros] =
    await Promise.all([
      backfillConsagracionFormaciones(supabase),
      backfillConsagracionRetiros(supabase),
      backfillRetiros(supabase),
      backfillFormacionesMisioneros(supabase),
    ]);

  const allResults = [consagracionFormaciones, consagracionRetiros, retiros, formacionesMisioneros];

  for (const r of allResults) {
    console.log(`  ${r.origin}: creados=${r.created} | actualizados=${r.updated} | omitidos=${r.skipped} | errores=${r.errors}`);
    for (const e of r.errorDetails) console.log(`    ERROR: ${e}`);
  }

  const totalCreated = allResults.reduce((a, r) => a + r.created, 0);
  const totalUpdated = allResults.reduce((a, r) => a + r.updated, 0);
  const totalSkipped = allResults.reduce((a, r) => a + r.skipped, 0);
  const totalErrors = allResults.reduce((a, r) => a + r.errors, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalAfter } = await (supabase.from('calendario_actividades').select('id', { count: 'exact', head: true }) as any);

  console.log('\n--- RESUMEN ---');
  console.log(`Creados: ${totalCreated} | Actualizados: ${totalUpdated} | Omitidos: ${totalSkipped} | Errores: ${totalErrors}`);
  console.log(`Actividades antes: ${totalBefore ?? 0} | Despues: ${totalAfter ?? 0}`);
  console.log(`Net new records: ${(totalAfter ?? 0) - (totalBefore ?? 0)}`);

  // Validate no duplicates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allDedupeKeys } = await (supabase.from('calendario_actividades').select('dedupe_key') as any);
  if (allDedupeKeys) {
    const counts: Record<string, number> = {};
    for (const row of allDedupeKeys) {
      if (row.dedupe_key) counts[row.dedupe_key] = (counts[row.dedupe_key] ?? 0) + 1;
    }
    const duplicates = Object.entries(counts).filter(([, c]) => c > 1);
    if (duplicates.length > 0) {
      console.error(`\n[ERROR] Duplicados: ${duplicates.length}`);
      duplicates.forEach(([k, c]) => console.error(`  ${k}: ${c}`));
      process.exit(1);
    }
    console.log('[OK] Sin duplicados.');
  }

  console.log('\n=== BACKFILL COMPLETO ===\n');
  process.exit(totalErrors > 0 ? 1 : 0);
};

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
