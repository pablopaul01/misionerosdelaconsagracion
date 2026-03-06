'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useFormacion,
  useMisionerosDeFormacion,
  useInscribirMisionero,
  useUpdateFormacion,
  useFinalizarFormacionMisioneros,
  useMarcarCompletoMisionero,
} from '@/lib/queries/formaciones';
import { useMisioneros } from '@/lib/queries/misioneros';
import { ClaseList } from '@/components/formaciones/ClaseList';
import { TIPO_FORMACION_LABEL, DIAS_SEMANA } from '@/lib/constants/formaciones';
import { formatFechaCorta } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function FormacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: formacion, isLoading } = useFormacion(id);
  const { data: inscriptos = [] } = useMisionerosDeFormacion(id);
  const { data: todosMisioneros = [] } = useMisioneros();
  const { mutateAsync: inscribir } = useInscribirMisionero(id);
  const { mutateAsync: finalizar, isPending: finalizando } = useFinalizarFormacionMisioneros();
  const { mutate: marcarCompleto } = useMarcarCompletoMisionero(id);

  const { mutateAsync: updateFormacion } = useUpdateFormacion(id);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');
  const [editandoFechaInicio, setEditandoFechaInicio] = useState(false);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [errorFinalizar, setErrorFinalizar] = useState('');

  const handleFinalizar = async () => {
    setErrorFinalizar('');
    try {
      await finalizar(id);
      setConfirmarFinalizar(false);
    } catch (e) {
      setErrorFinalizar((e as Error)?.message ?? 'Error al finalizar');
    }
  };

  // Misioneros que no están inscriptos en esta formación
  const inscriptosIds = new Set(inscriptos.map((i) => i.misionero_id));
  const disponibles = todosMisioneros.filter((m) => !inscriptosIds.has(m.id));

  const handleInscribir = async () => {
    if (!misioneroSeleccionado) return;
    await inscribir(misioneroSeleccionado);
    setMisioneroSeleccionado('');
  };

  const handleGuardarFechaInicio = async () => {
    if (!nuevaFechaInicio) return;
    await updateFormacion({ fecha_inicio: nuevaFechaInicio });
    setEditandoFechaInicio(false);
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">Formación no encontrada</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {/* Fila 1: navegación + acción */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
          {!formacion.finalizada && (
            <Button
              variant="outline"
              className="border-brand-gold text-brand-dark hover:bg-brand-gold/10 shrink-0"
              onClick={() => setConfirmarFinalizar(true)}
            >
              Finalizar formación
            </Button>
          )}
        </div>

        {/* Fila 2: título */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-xl text-brand-dark">
            {TIPO_FORMACION_LABEL[formacion.tipo]}
          </h1>
          {formacion.finalizada && (
            <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Finalizada
            </span>
          )}
        </div>

        {/* Fila 3: metadata */}
        <div className="flex items-center gap-2 flex-wrap text-sm text-brand-brown">
          <span>{formacion.anio}</span>
          <span>·</span>
          <span>Inicia</span>
          {editandoFechaInicio ? (
            <>
              <Input
                type="date"
                value={nuevaFechaInicio}
                onChange={(e) => setNuevaFechaInicio(e.target.value)}
                className="h-7 text-sm w-36"
              />
              <Button size="sm" className="bg-brand-brown text-white h-7 px-2" onClick={handleGuardarFechaInicio}>
                OK
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditandoFechaInicio(false)}>
                ✕
              </Button>
            </>
          ) : (
            <button
              className="hover:underline text-brand-brown"
              onClick={() => { setNuevaFechaInicio(formacion.fecha_inicio); setEditandoFechaInicio(true); }}
            >
              {formatFechaCorta(formacion.fecha_inicio)}
            </button>
          )}
          <span>· Clase los {DIAS_SEMANA[formacion.dia_semana]}</span>
        </div>
      </div>

      <Tabs defaultValue="clases">
        <TabsList className="bg-brand-creamLight">
          <TabsTrigger value="clases">Clases</TabsTrigger>
          <TabsTrigger value="misioneros">
            Misioneros
            <Badge className="ml-2 bg-brand-brown text-white text-xs">{inscriptos.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clases" className="mt-4">
          <ClaseList formacionId={id} />
        </TabsContent>

        <TabsContent value="misioneros" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Inscribir misionero */}
            <div className="flex gap-3 items-end bg-brand-cream p-4 rounded-lg">
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-brand-dark">Inscribir misionero</span>
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
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!misioneroSeleccionado}
                    className="bg-brand-brown hover:bg-brand-dark text-white"
                  >
                    Inscribir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar inscripción?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El misionero quedará inscripto en esta formación.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleInscribir}
                      className="bg-brand-brown hover:bg-brand-dark text-white"
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Stats y lista de inscriptos */}
            {inscriptos.length > 0 && (() => {
              const completaron = inscriptos.filter((i) => i.completo === true).length;
              return (
                <p className="text-sm text-brand-brown">
                  {completaron > 0 && (
                    <span className="text-green-700 font-medium">{completaron} completaron · </span>
                  )}
                  {inscriptos.length} inscriptos en total
                </p>
              );
            })()}

            <div className="flex flex-col gap-2">
              {inscriptos.map((insc) => (
                <div
                  key={insc.id}
                  className="bg-white border border-brand-creamLight rounded-lg px-4 py-3 flex flex-col gap-2"
                >
                  {/* Fila 1: nombre + toggles de completado */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-brand-dark truncate">
                      {insc.misioneros?.apellido}, {insc.misioneros?.nombre}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        title={insc.completo === true ? 'Completó — click para desmarcar' : 'Marcar como completó'}
                        onClick={() => marcarCompleto({ id: insc.id, completo: insc.completo === true ? null : true })}
                        className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                          insc.completo === true
                            ? 'bg-green-600 text-white'
                            : 'bg-transparent text-green-700 border border-green-600 hover:bg-green-50'
                        }`}
                      >
                        ✓
                      </button>
                      <button
                        title={insc.completo === false ? 'No completó — click para desmarcar' : 'Marcar como no completó'}
                        onClick={() => marcarCompleto({ id: insc.id, completo: insc.completo === false ? null : false })}
                        className={`h-7 w-7 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                          insc.completo === false
                            ? 'bg-red-500 text-white'
                            : 'bg-transparent text-red-500 border border-red-400 hover:bg-red-50'
                        }`}
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                  {/* Fila 2: DNI + link a asistencias */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-brand-brown">DNI {insc.misioneros?.dni}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-brand-teal h-6 px-2 text-xs"
                      onClick={() => router.push(`/admin/formaciones/${id}/asistencias`)}
                    >
                      Asistencias →
                    </Button>
                  </div>
                </div>
              ))}

              {inscriptos.length === 0 && (
                <p className="text-brand-brown text-sm">No hay misioneros inscriptos aún</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* AlertDialog finalizar formación */}
      <AlertDialog
        open={confirmarFinalizar}
        onOpenChange={(open) => { if (!open) { setConfirmarFinalizar(false); setErrorFinalizar(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar la formación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marca la formación <strong>{TIPO_FORMACION_LABEL[formacion.tipo]} {formacion.anio}</strong> como
              concluida. Podés seguir editando misioneros y asistencias después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorFinalizar && <p className="text-sm text-red-600 px-1">{errorFinalizar}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-brown hover:bg-brand-dark text-white"
              onClick={handleFinalizar}
              disabled={finalizando}
            >
              {finalizando ? 'Finalizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
