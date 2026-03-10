'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { exportarListaAsistencia } from '@/lib/utils/exportExcel';
import { useMisioneros } from '@/lib/queries/misioneros';
import {
  useGrupoOracion,
  useAsistenciasGrupoOracion,
  useCrearAsistenciaGrupoOracion,
  useEliminarAsistenciaGrupoOracion,
} from '@/lib/queries/grupo-oracion';

export default function GrupoOracionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: grupo, isLoading: loadingGrupo } = useGrupoOracion(id);
  const { data: asistencias = [], isLoading: loadingAsistencias, refetch } = useAsistenciasGrupoOracion(id);
  const { data: misioneros = [] } = useMisioneros();
  const { mutateAsync: crearAsistencia, isPending: creando } = useCrearAsistenciaGrupoOracion(id);
  const { mutateAsync: eliminarAsistencia, isPending: eliminando } = useEliminarAsistenciaGrupoOracion(id);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');
  const [eliminarTarget, setEliminarTarget] = useState<{ id: string; nombre: string } | null>(null);

  const asistentes = useMemo(
    () => asistencias.filter((a) => a.asistio !== false),
    [asistencias]
  );

  const misionerosIds = new Set(asistencias.map((a) => a.misionero_id));
  const disponibles = misioneros.filter((m) => !misionerosIds.has(m.id));

  const handleAgregar = async () => {
    if (!misioneroSeleccionado) return;
    try {
      await crearAsistencia(misioneroSeleccionado);
      setMisioneroSeleccionado('');
      toast.success('Asistencia agregada');
    } catch {
      toast.error('Error al agregar asistencia');
    }
  };

  const handleExportar = () => {
    if (!grupo) return;
    const filas = asistentes
      .map((a) => ({
        apellido: a.misioneros?.apellido ?? '',
        nombre: a.misioneros?.nombre ?? '',
        dni: a.misioneros?.dni ?? '',
      }))
      .filter((row) => row.apellido || row.nombre);

    exportarListaAsistencia(
      filas,
      `grupo_oracion_${grupo.fecha}`,
      `Grupo de oración ${new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}`,
      false,
    );
  };

  if (loadingGrupo) return <p className="text-brand-brown">Cargando...</p>;
  if (!grupo) return <p className="text-red-600">Grupo no encontrado</p>;

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
            Grupo de oración {new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
          </h1>
          {grupo.activa ? (
            <Badge className="bg-brand-gold text-brand-dark">Activa</Badge>
          ) : (
            <Badge className="bg-brand-creamLight text-brand-brown">Inactiva</Badge>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-title text-brand-brown">Asistencias</h2>
          <Button variant="outline" onClick={handleExportar} disabled={asistentes.length === 0}>
            Exportar Excel
          </Button>
        </div>

        <div className="bg-brand-cream/60 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-sm font-medium text-brand-dark">Agregar asistencia</span>
          <Select value={misioneroSeleccionado} onValueChange={setMisioneroSeleccionado}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar misionero..." />
            </SelectTrigger>
            <SelectContent>
              {disponibles.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.apellido}, {m.nombre} — DNI {m.dni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAgregar}
            disabled={!misioneroSeleccionado || creando}
            className="bg-brand-brown hover:bg-brand-dark text-white"
          >
            {creando ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>

        {loadingAsistencias && <p className="text-sm text-brand-brown">Cargando asistencias...</p>}

        <div className="flex flex-col gap-2">
          {asistencias.map((asistencia) => (
            <div
              key={asistencia.id}
              className="flex items-center justify-between gap-3 border border-brand-creamLight rounded-lg px-3 py-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-brand-dark truncate">
                  {asistencia.misioneros?.apellido}, {asistencia.misioneros?.nombre}
                </span>
                <span className="text-xs text-brand-brown">DNI {asistencia.misioneros?.dni ?? '—'}</span>
              </div>
              <button
                type="button"
                className="text-red-500 shrink-0 p-1"
                onClick={() =>
                  setEliminarTarget({
                    id: asistencia.id,
                    nombre: `${asistencia.misioneros?.apellido ?? ''}, ${asistencia.misioneros?.nombre ?? ''}`.trim(),
                  })
                }
                disabled={eliminando}
                aria-label="Eliminar asistencia"
              >
                <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))}

          {!loadingAsistencias && asistencias.length === 0 && (
            <p className="text-sm text-brand-brown">Sin asistencias registradas</p>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!eliminarTarget}
        onOpenChange={(open) => { if (!open) setEliminarTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asistencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la asistencia de <strong>{eliminarTarget?.nombre}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!eliminarTarget) return;
                try {
                  await eliminarAsistencia(eliminarTarget.id);
                  await refetch();
                  setEliminarTarget(null);
                  toast.success('Asistencia eliminada');
                } catch (e) {
                  toast.error((e as Error)?.message ?? 'Error al eliminar');
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
