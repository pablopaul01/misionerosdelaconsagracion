'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormacion, useMisionerosDeFormacion, useInscribirMisionero, useUpdateFormacion } from '@/lib/queries/formaciones';
import { useMisioneros } from '@/lib/queries/misioneros';
import { ClaseList } from '@/components/formaciones/ClaseList';
import { TIPO_FORMACION_LABEL, DIAS_SEMANA } from '@/lib/constants/formaciones';
import { formatFechaCorta } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

  const { mutateAsync: updateFormacion } = useUpdateFormacion(id);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');
  const [editandoFechaInicio, setEditandoFechaInicio] = useState(false);
  const [nuevaFechaInicio, setNuevaFechaInicio] = useState('');

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown">
          ← Volver
        </Button>
        <div>
          <h1 className="font-title text-2xl text-brand-dark">
            {TIPO_FORMACION_LABEL[formacion.tipo]}
          </h1>
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

            {/* Lista de inscriptos */}
            <div className="flex flex-col gap-2">
              {inscriptos.map((insc) => (
                <div
                  key={insc.id}
                  className="flex items-center justify-between bg-white border border-brand-creamLight rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-brand-dark">
                      {insc.misioneros?.apellido}, {insc.misioneros?.nombre}
                    </span>
                    <span className="text-sm text-brand-brown ml-3">DNI {insc.misioneros?.dni}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand-teal"
                    onClick={() => router.push(`/admin/formaciones/${id}/asistencias`)}
                  >
                    Ver asistencias →
                  </Button>
                </div>
              ))}

              {inscriptos.length === 0 && (
                <p className="text-brand-brown text-sm">No hay misioneros inscriptos aún</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
