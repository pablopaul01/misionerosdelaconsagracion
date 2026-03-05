import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = await createClient();

  const [
    { count: totalMisioneros },
    { count: totalFormaciones },
    { count: clasesActivas },
    { count: totalFormacionesConsagracion },
    { count: totalInscripciones },
  ] = await Promise.all([
    supabase.from('misioneros').select('*', { count: 'exact', head: true }),
    supabase.from('formaciones_misioneros').select('*', { count: 'exact', head: true }),
    supabase.from('clases').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('formaciones_consagracion').select('*', { count: 'exact', head: true }),
    supabase.from('inscripciones_consagracion').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalMisioneros:              totalMisioneros ?? 0,
    totalFormaciones:             totalFormaciones ?? 0,
    clasesActivas:                clasesActivas ?? 0,
    totalFormacionesConsagracion: totalFormacionesConsagracion ?? 0,
    totalInscripciones:           totalInscripciones ?? 0,
  };
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
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-title text-2xl text-brand-dark">Dashboard</h1>

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
      </div>
    </div>
  );
}
