'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useFormacion } from '@/lib/queries/formaciones';
import { TIPO_FORMACION_LABEL } from '@/lib/constants/formaciones';
import { formatFechaCorta } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Query con join: clases + asistencias por misionero
const useAsistenciasFormacion = (formacionId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ['asistencias-formacion', formacionId],
    queryFn: async () => {
      const [clasesRes, inscriptosRes] = await Promise.all([
        supabase
          .from('clases')
          .select('id, numero, fecha, activa')
          .eq('formacion_id', formacionId)
          .order('numero'),
        supabase
          .from('inscripciones_misioneros')
          .select('misionero_id, misioneros(id, nombre, apellido, dni)')
          .eq('formacion_id', formacionId),
      ]);

      if (clasesRes.error) throw clasesRes.error;
      if (inscriptosRes.error) throw inscriptosRes.error;

      const clases = clasesRes.data ?? [];
      const inscriptos = inscriptosRes.data ?? [];

      if (clases.length === 0 || inscriptos.length === 0) {
        return { clases, inscriptos, asistencias: {} };
      }

      const { data: asistencias } = await supabase
        .from('asistencias_misioneros')
        .select('clase_id, misionero_id, asistio, motivo_ausencia')
        .in('clase_id', clases.map((c) => c.id));

      // Índice: `${clase_id}-${misionero_id}` → asistencia
      const asistenciasMap = Object.fromEntries(
        (asistencias ?? []).map((a) => [`${a.clase_id}-${a.misionero_id}`, a]),
      );

      return { clases, inscriptos, asistencias: asistenciasMap };
    },
    enabled: !!formacionId,
  });
};

export default function AsistenciasFormacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: formacion } = useFormacion(id);
  const { data, isLoading } = useAsistenciasFormacion(id);

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;

  const { clases = [], inscriptos = [], asistencias = {} } = data ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown">
          ← Volver
        </Button>
        <h1 className="font-title text-2xl text-brand-dark">
          Asistencias — {formacion ? TIPO_FORMACION_LABEL[formacion.tipo] : ''} {formacion?.anio}
        </h1>
      </div>

      {clases.length === 0 || inscriptos.length === 0 ? (
        <p className="text-brand-brown">No hay clases o misioneros inscriptos aún</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-creamLight">
          <table className="text-sm min-w-max">
            <thead className="bg-brand-creamLight">
              <tr>
                <th className="px-4 py-3 text-left font-title text-brand-dark sticky left-0 bg-brand-creamLight">
                  Misionero
                </th>
                {clases.map((clase) => (
                  <th key={clase.id} className="px-3 py-3 text-center font-title text-brand-dark min-w-[80px]">
                    <div>Clase {clase.numero}</div>
                    <div className="text-xs font-normal text-brand-brown">{formatFechaCorta(clase.fecha)}</div>
                    {clase.activa && (
                      <Badge className="bg-brand-gold text-brand-dark text-xs mt-1">Activa</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inscriptos.map((insc) => {
                const misionero = insc.misioneros;
                if (!misionero) return null;

                // Calcular totales para este misionero
                const totalClases = clases.length;
                const asistio = clases.filter(
                  (c) => asistencias[`${c.id}-${insc.misionero_id}`]?.asistio === true,
                ).length;

                return (
                  <tr key={insc.misionero_id} className="border-t border-brand-creamLight hover:bg-brand-cream/30">
                    <td className="px-4 py-3 sticky left-0 bg-white font-medium text-brand-dark">
                      <div>{misionero.apellido}, {misionero.nombre}</div>
                      <div className="text-xs text-brand-brown">{asistio}/{totalClases}</div>
                    </td>
                    {clases.map((clase) => {
                      const reg = asistencias[`${clase.id}-${insc.misionero_id}`];
                      return (
                        <td key={clase.id} className="px-3 py-3 text-center">
                          {reg == null ? (
                            <span className="text-brand-brown/40">—</span>
                          ) : reg.asistio ? (
                            <span className="text-green-600 font-bold" title="Asistió">✓</span>
                          ) : (
                            <span
                              className="text-red-500 font-bold cursor-help"
                              title={reg.motivo_ausencia ?? 'No asistió'}
                            >
                              ✗
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
