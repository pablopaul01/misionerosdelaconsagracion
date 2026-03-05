'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useFormacion, useToggleAsistenciaMisionero } from '@/lib/queries/formaciones';
import { TIPO_FORMACION_LABEL } from '@/lib/constants/formaciones';
import { formatFechaCorta } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type AsistenciaReg = {
  id: string;
  clase_id: string;
  misionero_id: string;
  asistio: boolean;
  motivo_ausencia: string | null;
};

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
        return { clases, inscriptos, asistencias: {} as Record<string, AsistenciaReg> };
      }

      const { data: asistencias } = await supabase
        .from('asistencias_misioneros')
        .select('id, clase_id, misionero_id, asistio, motivo_ausencia')
        .in('clase_id', clases.map((c) => c.id));

      // Índice: `${clase_id}-${misionero_id}` → asistencia
      const asistenciasMap = Object.fromEntries(
        (asistencias ?? []).map((a) => [`${a.clase_id}-${a.misionero_id}`, a as AsistenciaReg]),
      );

      return { clases, inscriptos, asistencias: asistenciasMap };
    },
    enabled: !!formacionId,
  });
};

// ── Celda toggle de asistencia ──────────────────────────────────────────────

interface AsistenciaCeldaProps {
  formacionId: string;
  claseId: string;
  misioneroId: string;
  reg: AsistenciaReg | undefined;
  className?: string;
}

const AsistenciaCelda = ({ formacionId, claseId, misioneroId, reg, className }: AsistenciaCeldaProps) => {
  const { mutate, isPending } = useToggleAsistenciaMisionero(formacionId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  const handleClick = () => {
    if (reg?.asistio === false) {
      // Ya está ausente → click alterna a asistió directamente
      mutate({ claseId, misioneroId, asistio: true, asistenciaId: reg.id });
    } else if (reg?.asistio === true || reg === undefined) {
      // Asistió o sin registrar → marcar como ausente con motivo
      setMotivo('');
      setDialogOpen(true);
    }
  };

  const confirmarAusencia = () => {
    mutate({ claseId, misioneroId, asistio: false, asistenciaId: reg?.id, motivoAusencia: motivo });
    setDialogOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        title={
          reg === undefined
            ? 'Sin registrar — click para marcar'
            : reg.asistio
              ? 'Asistió — click para cambiar'
              : `No asistió${reg.motivo_ausencia ? `: ${reg.motivo_ausencia}` : ''} — click para editar`
        }
        className={cn(
          'w-8 h-8 rounded-full text-sm font-bold transition-colors flex items-center justify-center',
          reg?.asistio === true  && 'bg-green-100 text-green-700 hover:bg-green-200',
          reg?.asistio === false && 'bg-red-100 text-red-600 hover:bg-red-200',
          reg === undefined      && 'bg-gray-100 text-gray-400 hover:bg-gray-200',
          isPending              && 'opacity-50 cursor-wait',
          className,
        )}
      >
        {reg === undefined ? '·' : reg.asistio ? '✓' : '✗'}
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-title text-brand-dark">Registrar ausencia</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              placeholder="Ej: enfermedad, trabajo, viaje..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={confirmarAusencia}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Confirmar ausencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Página ──────────────────────────────────────────────────────────────────

export default function AsistenciasFormacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: formacion } = useFormacion(id);
  const { data, isLoading } = useAsistenciasFormacion(id);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleExpandido = (misioneroId: string) =>
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(misioneroId)) { next.delete(misioneroId); } else { next.add(misioneroId); }
      return next;
    });

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
        <>
          {/* ── Desktop: tabla ── */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-brand-creamLight">
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

                  const asistioCount = clases.filter(
                    (c) => asistencias[`${c.id}-${insc.misionero_id}`]?.asistio === true,
                  ).length;

                  return (
                    <tr key={insc.misionero_id} className="border-t border-brand-creamLight hover:bg-brand-cream/30">
                      <td className="px-4 py-3 sticky left-0 bg-white font-medium text-brand-dark">
                        <div>{misionero.apellido}, {misionero.nombre}</div>
                        <div className="text-xs text-brand-brown">{asistioCount}/{clases.length}</div>
                      </td>
                      {clases.map((clase) => {
                        const reg = asistencias[`${clase.id}-${insc.misionero_id}`];
                        return (
                          <td key={clase.id} className="px-2 py-2 text-center">
                            <AsistenciaCelda
                              formacionId={id}
                              claseId={clase.id}
                              misioneroId={insc.misionero_id}
                              reg={reg}
                              className="mx-auto"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: acordeón por misionero ── */}
          <div className="md:hidden flex flex-col gap-2">
            {inscriptos.map((insc) => {
              const misionero = insc.misioneros;
              if (!misionero) return null;

              const abierto = expandidos.has(insc.misionero_id);
              const asistioCount = clases.filter(
                (c) => asistencias[`${c.id}-${insc.misionero_id}`]?.asistio === true,
              ).length;

              return (
                <div key={insc.misionero_id} className="bg-white border border-brand-creamLight rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => toggleExpandido(insc.misionero_id)}
                  >
                    <div>
                      <p className="font-title text-brand-dark font-semibold text-sm">
                        {misionero.apellido}, {misionero.nombre}
                      </p>
                      <p className="text-xs text-brand-brown">{asistioCount}/{clases.length} asistencias</p>
                    </div>
                    <span className="text-brand-brown text-lg leading-none">{abierto ? '▲' : '▼'}</span>
                  </button>

                  {abierto && (
                    <div className="border-t border-brand-creamLight divide-y divide-brand-creamLight/60">
                      {clases.map((clase) => {
                        const reg = asistencias[`${clase.id}-${insc.misionero_id}`];
                        return (
                          <div key={clase.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-brand-dark w-16">
                                Clase {clase.numero}
                              </span>
                              {clase.activa && (
                                <Badge className="bg-brand-gold text-brand-dark text-xs px-1">Activa</Badge>
                              )}
                              {clase.fecha && (
                                <span className="text-xs text-brand-brown">{formatFechaCorta(clase.fecha)}</span>
                              )}
                            </div>
                            <AsistenciaCelda
                              formacionId={id}
                              claseId={clase.id}
                              misioneroId={insc.misionero_id}
                              reg={reg}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
