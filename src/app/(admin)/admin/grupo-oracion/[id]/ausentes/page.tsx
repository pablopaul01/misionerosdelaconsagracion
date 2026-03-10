'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMisioneros } from '@/lib/queries/misioneros';
import { useAsistenciasGrupoOracion, useGrupoOracion } from '@/lib/queries/grupo-oracion';
import { exportarListaAsistencia } from '@/lib/utils/exportExcel';

export default function GrupoOracionAusentesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: grupo, isLoading: loadingGrupo } = useGrupoOracion(id);
  const { data: asistencias = [], isLoading: loadingAsistencias } = useAsistenciasGrupoOracion(id);
  const { data: misioneros = [] } = useMisioneros();

  const presentesIds = useMemo(
    () => new Set(asistencias.map((a) => a.misionero_id)),
    [asistencias]
  );

  const ausentes = useMemo(
    () => misioneros.filter((m) => m.activo && !presentesIds.has(m.id)),
    [misioneros, presentesIds]
  );

  if (loadingGrupo) return <p className="text-brand-brown">Cargando...</p>;
  if (!grupo) return <p className="text-red-600">Grupo no encontrado</p>;

  const handleExportar = () => {
    const filas = ausentes.map((m) => ({
      apellido: m.apellido,
      nombre: m.nombre,
      dni: m.dni,
    }));

    exportarListaAsistencia(
      filas,
      `ausentes_grupo_oracion_${grupo.fecha}`,
      `Ausentes Grupo de oración ${new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}`,
      false,
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push('/admin/grupo-oracion')} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-2xl text-brand-dark">
            Ausentes — {new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
          </h1>
          {grupo.activa ? (
            <Badge className="bg-brand-gold text-brand-dark">Activa</Badge>
          ) : (
            <Badge className="bg-brand-creamLight text-brand-brown">Inactiva</Badge>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-title text-brand-brown">Misioneros ausentes</h2>
          <Button variant="outline" onClick={handleExportar} disabled={ausentes.length === 0}>
            Exportar Excel
          </Button>
        </div>
        {loadingAsistencias && <p className="text-sm text-brand-brown">Cargando...</p>}
        {!loadingAsistencias && ausentes.length === 0 && (
          <p className="text-sm text-brand-brown">No hay misioneros activos ausentes</p>
        )}
        <div className="flex flex-col gap-2">
          {ausentes.map((m) => (
            <div key={m.id} className="border border-brand-creamLight rounded-lg px-3 py-2">
              <span className="text-sm text-brand-dark">
                {m.apellido}, {m.nombre}
              </span>
              <span className="text-xs text-brand-brown block">DNI {m.dni}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
