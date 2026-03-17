import { createClient } from '@/lib/supabase/server';
import { CumpleaniosAcordeon } from '@/components/dashboard/CumpleaniosAcordeon';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = await createClient();

  const [
    { count: totalMisioneros },
    { count: totalFormaciones },
    { count: clasesActivas },
    { count: totalFormacionesConsagracion },
    { count: totalInscripciones },
    { count: totalGruposOracion },
    { count: totalRetiros },
    { count: retirosProximos },
  ] = await Promise.all([
    supabase.from('misioneros').select('*', { count: 'exact', head: true }),
    supabase.from('formaciones_misioneros').select('*', { count: 'exact', head: true }),
    supabase.from('clases').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('formaciones_consagracion').select('*', { count: 'exact', head: true }),
    supabase.from('inscripciones_consagracion').select('*', { count: 'exact', head: true }),
    supabase.from('grupos_oracion').select('*', { count: 'exact', head: true }),
    supabase.from('retiros').select('*', { count: 'exact', head: true }),
    supabase
      .from('retiros')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_fin', new Date().toISOString().split('T')[0]),
  ]);

  return {
    totalMisioneros:              totalMisioneros ?? 0,
    totalFormaciones:             totalFormaciones ?? 0,
    clasesActivas:                clasesActivas ?? 0,
    totalFormacionesConsagracion: totalFormacionesConsagracion ?? 0,
    totalInscripciones:           totalInscripciones ?? 0,
    totalGruposOracion:           totalGruposOracion ?? 0,
    totalRetiros:                 totalRetiros ?? 0,
    retirosProximos:              retirosProximos ?? 0,
  };
}

async function getCumpleaniosProximos() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('misioneros')
    .select('id, nombre, apellido, fecha_nacimiento')
    .not('fecha_nacimiento', 'is', null)
    .eq('activo', true);

  if (!data) return [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en30 = new Date(hoy);
  en30.setDate(hoy.getDate() + 30);

  return data
    .flatMap((m) => {
      const fn = new Date(m.fecha_nacimiento!);
      // cumple este año
      const esteAnio = new Date(hoy.getFullYear(), fn.getMonth(), fn.getDate());
      // si ya pasó, usar el próximo año
      const proxCumple = esteAnio < hoy
        ? new Date(hoy.getFullYear() + 1, fn.getMonth(), fn.getDate())
        : esteAnio;

      if (proxCumple > en30) return [];

      const diasHasta = Math.round((proxCumple.getTime() - hoy.getTime()) / 86_400_000);
      return [{ id: m.id, nombre: m.nombre, apellido: m.apellido, fecha_nacimiento: m.fecha_nacimiento!, diasHasta }];
    })
    .sort((a, b) => a.diasHasta - b.diasHasta);
}

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className={`bg-white rounded-xl border p-5 flex flex-col gap-1 ${color}`}>
    <span className="text-3xl font-title text-brand-dark">{value}</span>
    <span className="text-sm text-brand-brown">{label}</span>
  </div>
);

export default async function DashboardPage() {
  const [stats, cumpleanios] = await Promise.all([getStats(), getCumpleaniosProximos()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-title text-2xl text-brand-dark">Dashboard</h1>

      {/* Cumpleaños próximos */}
      {cumpleanios.length > 0 && <CumpleaniosAcordeon misioneros={cumpleanios} />}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Misioneros registrados"
          value={stats.totalMisioneros}
          color="border-brand-creamLight"
        />
        <StatCard
          label="Formaciones de misioneros"
          value={stats.totalFormaciones}
          color="border-brand-creamLight"
        />
        <StatCard
          label="Clases activas ahora"
          value={stats.clasesActivas}
          color="border-brand-gold"
        />
        <StatCard
          label="Formaciones de Consagración"
          value={stats.totalFormacionesConsagracion}
          color="border-brand-creamLight"
        />
        <StatCard
          label="Inscripciones a Consagración"
          value={stats.totalInscripciones}
          color="border-brand-teal"
        />
        <StatCard
          label="Grupos de oración"
          value={stats.totalGruposOracion}
          color="border-brand-creamLight"
        />
        <StatCard
          label="Retiros creados"
          value={stats.totalRetiros}
          color="border-brand-creamLight"
        />
        <StatCard
          label="Retiros en curso / próximos"
          value={stats.retirosProximos}
          color="border-brand-orange"
        />
      </div>
    </div>
  );
}
