'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useFormacion,
  useMisionerosDeFormacion,
  useInscribirMisionero,
  useUpdateFormacion,
  useFinalizarFormacionMisioneros,
  useMarcarCompletoMisionero,
  useEliminarMisioneroDeFormacion,
} from '@/lib/queries/formaciones';
import { useMisioneros } from '@/lib/queries/misioneros';
import { ClaseList } from '@/components/formaciones/ClaseList';
import { AsistenciasTab } from '@/components/formaciones/AsistenciasTab';
import { TIPO_FORMACION_LABEL, DIAS_SEMANA } from '@/lib/constants/formaciones';
import { formatFechaCorta } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, MoreVertical } from 'lucide-react';
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
  const { mutateAsync: inscribir, isPending: inscribiendo } = useInscribirMisionero(id);
  const { mutateAsync: finalizar, isPending: finalizando } = useFinalizarFormacionMisioneros();
  const { mutate: marcarCompleto } = useMarcarCompletoMisionero(id);
  const { mutateAsync: eliminarInscripcion } = useEliminarMisioneroDeFormacion(id);

  const { mutateAsync: updateFormacion } = useUpdateFormacion(id);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');
  const [confirmarInscribir, setConfirmarInscribir] = useState(false);
  const [errorInscribir, setErrorInscribir] = useState('');
  const [editandoFechaInicio, setEditandoFechaInicio] = useState(false);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [errorFinalizar, setErrorFinalizar] = useState('');
  const [eliminarTarget, setEliminarTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [errorEliminar, setErrorEliminar] = useState('');

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
    setErrorInscribir('');
    try {
      await inscribir(misioneroSeleccionado);
      setMisioneroSeleccionado('');
      setConfirmarInscribir(false);
    } catch (e) {
      setErrorInscribir((e as Error)?.message ?? 'Error al inscribir');
    }
  };

  const handleGuardarFechaInicio = async () => {
    if (!nuevaFechaInicio) return;
    await updateFormacion({ fecha_inicio: nuevaFechaInicio });
    setEditandoFechaInicio(false);
  };

  const handleEliminarInscripcion = async () => {
    if (!eliminarTarget) return;
    setErrorEliminar('');
    try {
      await eliminarInscripcion(eliminarTarget.id);
      setEliminarTarget(null);
    } catch (e) {
      setErrorEliminar((e as Error)?.message ?? 'Error al eliminar');
    }
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
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
        </TabsList>

        <TabsContent value="clases" className="mt-4">
          <ClaseList formacionId={id} />
        </TabsContent>

        <TabsContent value="misioneros" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Inscribir misionero */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end bg-brand-cream p-4 rounded-lg">
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

              <AlertDialog
                open={confirmarInscribir}
                onOpenChange={(open) => { if (!inscribiendo) { setConfirmarInscribir(open); setErrorInscribir(''); } }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!misioneroSeleccionado}
                    className="bg-brand-brown hover:bg-brand-dark text-white"
                    onClick={() => setConfirmarInscribir(true)}
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
                  {errorInscribir && <p className="text-sm text-red-600 px-1">{errorInscribir}</p>}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={inscribiendo}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => { e.preventDefault(); handleInscribir(); }}
                      disabled={inscribiendo}
                      className="bg-brand-brown hover:bg-brand-dark text-white"
                    >
                      {inscribiendo ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Inscribiendo...</>
                      ) : 'Confirmar'}
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
                    <ActionMenu
                      items={[
                        {
                          label: insc.completo === true ? 'Desmarcar completado' : 'Marcar completado',
                          onClick: () => marcarCompleto({ id: insc.id, completo: insc.completo === true ? null : true }),
                        },
                        {
                          label: insc.completo === false ? 'Desmarcar no completado' : 'Marcar no completado',
                          onClick: () => marcarCompleto({ id: insc.id, completo: insc.completo === false ? null : false }),
                        },
                        {
                          label: 'Eliminar',
                          onClick: () => {
                            setErrorEliminar('');
                            setEliminarTarget({
                              id: insc.id,
                              nombre: `${insc.misioneros?.apellido ?? ''}, ${insc.misioneros?.nombre ?? ''}`.trim(),
                            });
                          },
                          tone: 'danger',
                        },
                      ]}
                    />
                  </div>
                  {/* Fila 2: DNI */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-brand-brown">DNI {insc.misioneros?.dni}</span>
                  </div>
                </div>
              ))}

              {inscriptos.length === 0 && (
                <p className="text-brand-brown text-sm">No hay misioneros inscriptos aún</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="asistencias" className="mt-4">
          <AsistenciasTab formacionId={id} />
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

      <AlertDialog
        open={!!eliminarTarget}
        onOpenChange={(open) => { if (!open) { setEliminarTarget(null); setErrorEliminar(''); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la inscripción de <strong>{eliminarTarget?.nombre}</strong> de esta formación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorEliminar && <p className="text-sm text-red-600 px-1">{errorEliminar}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 text-white"
              onClick={handleEliminarInscripcion}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionMenu({
  items,
}: {
  items: { label: string; onClick: () => void; tone?: 'danger' }[];
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="h-9 w-9 flex items-center justify-center rounded-md border border-brand-creamLight bg-white text-brand-brown"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-brand-creamLight rounded-lg shadow-lg z-50">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-creamLight ${
                item.tone === 'danger' ? 'text-red-600' : 'text-brand-dark'
              }`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
