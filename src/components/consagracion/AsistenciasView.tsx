'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useLeccionesConsagracion,
  useInscripcionesConsagracion,
  useAsistenciasConsagracion,
  useAddLeccion,
  useUpdateLeccion,
  useDeleteLeccion,
} from '@/lib/queries/consagracion';
import { leccionConsagracionSchema } from '@/lib/validations/consagracion';
import { TIPO_LECCION } from '@/lib/constants/consagracion';
import { AsistenciaToggle } from './AsistenciaToggle';
import { formatFechaCorta } from '@/lib/utils/dates';
import { exportarListaAsistencia } from '@/lib/utils/exportExcel';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface AsistenciasViewProps {
  formacionId: string;
}

const NuevaLeccionForm = ({ formacionId, proximoNumero }: { formacionId: string; proximoNumero: number }) => {
  const { mutateAsync: addLeccion } = useAddLeccion(formacionId);
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: { numero: proximoNumero, tipo: TIPO_LECCION.LECCION as 'leccion' | 'retiro', fecha: '' },
    validators: { onSubmit: leccionConsagracionSchema },
    onSubmit: async ({ value }) => {
      await addLeccion(value);
      setOpen(false);
      form.reset();
    },
  });

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-brand-brown text-brand-brown hover:bg-brand-cream"
      >
        + Agregar lección
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex gap-3 items-end bg-brand-cream p-4 rounded-lg flex-wrap"
    >
      <form.Field name="numero">
        {(field) => (
          <div className="flex flex-col gap-1.5 w-20">
            <Label>Nº</Label>
            <Input
              type="number"
              min={1}
              max={35}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="tipo">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as 'leccion' | 'retiro')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIPO_LECCION.LECCION}>Lección</SelectItem>
                <SelectItem value={TIPO_LECCION.RETIRO}>Retiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="fecha">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Fecha (opcional)</Label>
            <Input
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <div className="flex gap-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting} className="bg-brand-brown text-white">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
};

export const AsistenciasView = ({ formacionId }: AsistenciasViewProps) => {
  const { data: lecciones = [] } = useLeccionesConsagracion(formacionId);
  const { data: inscripciones = [] } = useInscripcionesConsagracion(formacionId);
  const { data: asistencias = [] } = useAsistenciasConsagracion(formacionId);
  const { mutateAsync: updateLeccion } = useUpdateLeccion(formacionId);
  const { mutateAsync: deleteLeccion } = useDeleteLeccion(formacionId);

  const [editandoFecha, setEditandoFecha] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [modoMobile, setModoMobile] = useState<'por-leccion' | 'por-participante'>('por-leccion');
  const [leccionSeleccionada, setLeccionSeleccionada] = useState<string | null>(null);

  const toggleExpandido = (id: string) =>
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });

  // Índice: `${leccion_id}-${inscripcion_id}` → asistencia
  const asistenciasMap = Object.fromEntries(
    asistencias.map((a) => [`${a.leccion_id}-${a.inscripcion_id}`, a]),
  );

  const proximoNumero = lecciones.length + 1;

  const handleGuardarFecha = async (leccionId: string) => {
    await updateLeccion({ id: leccionId, fecha: nuevaFecha });
    setEditandoFecha(null);
    setNuevaFecha('');
  };

  const handleEliminar = async (leccionId: string) => {
    try {
      await deleteLeccion(leccionId);
      toast.success('Lección eliminada');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Error al eliminar');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <NuevaLeccionForm formacionId={formacionId} proximoNumero={proximoNumero} />
        {inscripciones.length > 0 && (
          <Button
            variant="outline"
            className="border-brand-brown text-brand-brown hover:bg-brand-cream gap-2"
            onClick={() => exportarListaAsistencia(
              inscripciones.map(({ apellido, nombre }) => ({ apellido, nombre })),
              `Lista_Consagracion_${new Date().getFullYear()}`,
              `Asistencia — Consagración ${new Date().getFullYear()}`,
            )}
          >
            <FileDown className="w-4 h-4" />
            Exportar lista
          </Button>
        )}
      </div>

      {lecciones.length === 0 || inscripciones.length === 0 ? (
        <p className="text-brand-brown text-sm">
          {lecciones.length === 0 ? 'No hay lecciones creadas aún.' : 'No hay inscriptos aún.'}
        </p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-brand-creamLight">
            <table className="text-sm min-w-max">
              <thead className="bg-brand-creamLight">
                <tr>
                  <th className="px-4 py-3 text-left font-title text-brand-dark sticky left-0 bg-brand-creamLight">
                    Participante
                  </th>
                  {lecciones.map((leccion) => (
                    <th key={leccion.id} className="px-2 py-3 text-center font-title text-brand-dark min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <span>{leccion.tipo === TIPO_LECCION.RETIRO ? 'R' : ''}{leccion.numero}</span>
                        {leccion.tipo === TIPO_LECCION.RETIRO && (
                          <Badge className="bg-brand-gold text-brand-dark text-xs px-1">Retiro</Badge>
                        )}
                        {editandoFecha === leccion.id ? (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="date"
                              value={nuevaFecha}
                              onChange={(e) => setNuevaFecha(e.target.value)}
                              className="h-6 text-xs w-28 px-1"
                            />
                            <div className="flex gap-1">
                              <button className="text-xs text-brand-teal hover:underline" onClick={() => handleGuardarFecha(leccion.id)}>OK</button>
                              <button className="text-xs text-brand-brown hover:underline" onClick={() => setEditandoFecha(null)}>✕</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="text-xs font-normal text-brand-brown hover:underline"
                            onClick={() => { setEditandoFecha(leccion.id); setNuevaFecha(leccion.fecha ?? ''); }}
                          >
                            {leccion.fecha ? formatFechaCorta(leccion.fecha) : '+ fecha'}
                          </button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-xs text-red-400 hover:text-red-600">✕ elim.</button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar lección {leccion.numero}?</AlertDialogTitle>
                              <AlertDialogDescription>Solo se puede eliminar si no tiene asistencias registradas.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleEliminar(leccion.id)} className="bg-red-500 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((insc) => {
                  const asistioCount = lecciones.filter(
                    (l) => asistenciasMap[`${l.id}-${insc.id}`]?.asistio === true,
                  ).length;
                  const registradas = lecciones.filter(
                    (l) => asistenciasMap[`${l.id}-${insc.id}`] !== undefined,
                  ).length;
                  const porcentaje = registradas > 0 ? Math.round((asistioCount / registradas) * 100) : null;
                  return (
                    <tr key={insc.id} className="border-t border-brand-creamLight hover:bg-brand-cream/30">
                      <td className="px-4 py-2 sticky left-0 bg-white font-medium text-brand-dark">
                        <div>{insc.apellido}, {insc.nombre}</div>
                        <div className="text-xs text-brand-brown">
                          {asistioCount}/{lecciones.length}
                          {porcentaje !== null && <span className="ml-1">({porcentaje}%)</span>}
                        </div>
                      </td>
                      {lecciones.map((leccion) => {
                        const reg = asistenciasMap[`${leccion.id}-${insc.id}`];
                        return (
                          <td key={leccion.id} className="px-2 py-2">
                            <div className="flex justify-center">
                              <AsistenciaToggle
                                formacionId={formacionId}
                                leccionId={leccion.id}
                                inscripcionId={insc.id}
                                asistenciaId={reg?.id}
                                asistio={reg?.asistio}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: toggle de modos ── */}
          <div className="md:hidden flex flex-col gap-3">
            {/* Selector de modo */}
            <div className="flex rounded-lg border border-brand-creamLight overflow-hidden text-sm font-title">
              <button
                className={`flex-1 py-2 transition-colors ${modoMobile === 'por-leccion' ? 'bg-brand-brown text-white' : 'bg-white text-brand-brown'}`}
                onClick={() => setModoMobile('por-leccion')}
              >
                Por lección
              </button>
              <button
                className={`flex-1 py-2 transition-colors ${modoMobile === 'por-participante' ? 'bg-brand-brown text-white' : 'bg-white text-brand-brown'}`}
                onClick={() => setModoMobile('por-participante')}
              >
                Por participante
              </button>
            </div>

            {/* Modo: Por lección */}
            {modoMobile === 'por-leccion' && (
              <div className="flex flex-col gap-3">
                {/* Selector de lección */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-brand-dark font-title text-sm">Seleccionar lección</Label>
                  <Select
                    value={leccionSeleccionada ?? ''}
                    onValueChange={(v) => setLeccionSeleccionada(v)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Elegir lección..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lecciones.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.tipo === TIPO_LECCION.RETIRO ? 'Retiro' : 'Lección'} {l.numero}
                          {l.fecha ? ` — ${formatFechaCorta(l.fecha)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de inscriptos para la lección seleccionada */}
                {leccionSeleccionada && (() => {
                  const leccion = lecciones.find((l) => l.id === leccionSeleccionada)!;
                  const presentes = inscripciones.filter(
                    (i) => asistenciasMap[`${leccionSeleccionada}-${i.id}`]?.asistio === true,
                  ).length;
                  return (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-brand-brown text-right">{presentes}/{inscripciones.length} presentes</p>
                      {inscripciones.map((insc) => {
                        const reg = asistenciasMap[`${leccionSeleccionada}-${insc.id}`];
                        return (
                          <div
                            key={insc.id}
                            className="bg-white border border-brand-creamLight rounded-xl flex items-center justify-between px-4 py-3"
                          >
                            <div>
                              <p className="font-title text-brand-dark text-sm font-semibold">
                                {insc.apellido}, {insc.nombre}
                              </p>
                            </div>
                            <AsistenciaToggle
                              formacionId={formacionId}
                              leccionId={leccion.id}
                              inscripcionId={insc.id}
                              asistenciaId={reg?.id}
                              asistio={reg?.asistio}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {!leccionSeleccionada && (
                  <p className="text-sm text-brand-brown text-center py-4">
                    Seleccioná una lección para registrar asistencias
                  </p>
                )}
              </div>
            )}

            {/* Modo: Por participante (acordeón) */}
            {modoMobile === 'por-participante' && (
              <div className="flex flex-col gap-2">
                {inscripciones.map((insc) => {
                  const abierto = expandidos.has(insc.id);
                  const asistioCount = lecciones.filter(
                    (l) => asistenciasMap[`${l.id}-${insc.id}`]?.asistio === true,
                  ).length;
                  const registradas = lecciones.filter(
                    (l) => asistenciasMap[`${l.id}-${insc.id}`] !== undefined,
                  ).length;
                  const porcentaje = registradas > 0 ? Math.round((asistioCount / registradas) * 100) : null;

                  return (
                    <div key={insc.id} className="bg-white border border-brand-creamLight rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => toggleExpandido(insc.id)}
                      >
                        <div>
                          <p className="font-title text-brand-dark font-semibold text-sm">
                            {insc.apellido}, {insc.nombre}
                          </p>
                          <p className="text-xs text-brand-brown">
                            {asistioCount}/{lecciones.length} asistencias
                            {porcentaje !== null && <span className="ml-1">({porcentaje}%)</span>}
                          </p>
                        </div>
                        <span className="text-brand-brown text-lg leading-none">{abierto ? '▲' : '▼'}</span>
                      </button>

                      {abierto && (
                        <div className="border-t border-brand-creamLight divide-y divide-brand-creamLight/60">
                          {lecciones.map((leccion) => {
                            const reg = asistenciasMap[`${leccion.id}-${insc.id}`];
                            return (
                              <div key={leccion.id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-brand-dark w-6 text-center">
                                    {leccion.numero}
                                  </span>
                                  {leccion.tipo === TIPO_LECCION.RETIRO && (
                                    <Badge className="bg-brand-gold text-brand-dark text-xs px-1">Retiro</Badge>
                                  )}
                                  {leccion.fecha && (
                                    <span className="text-xs text-brand-brown">{formatFechaCorta(leccion.fecha)}</span>
                                  )}
                                </div>
                                <AsistenciaToggle
                                  formacionId={formacionId}
                                  leccionId={leccion.id}
                                  inscripcionId={insc.id}
                                  asistenciaId={reg?.id}
                                  asistio={reg?.asistio}
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
            )}
          </div>
        </>
      )}
    </div>
  );
};
