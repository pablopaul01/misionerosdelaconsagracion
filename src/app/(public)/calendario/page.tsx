'use client';

import { useState } from 'react';
import { CalendarDays, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CALENDARIO_ORIGEN_LABEL } from '@/lib/constants/calendario';
import { useCalendarioMisionero } from '@/lib/queries/calendario';
import { CalendarioVista } from '@/components/calendario/CalendarioVista';
import { CalendarioEventCard } from '@/components/calendario/CalendarioEventCard';
import type { ActividadCalendario } from '@/types/calendario';

import '@/styles/calendario-fullcalendar.css';

export const dynamic = 'force-dynamic';

export default function CalendarioMisioneroPage() {
  const [dni, setDni] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadCalendario | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const { data, isLoading, isError, error } = useCalendarioMisionero({
    dni,
    desde,
    hasta,
  });

  const handleBuscar = () => {
    if (!dni.trim()) return;
    setHasSearched(true);
    setSelectedActividad(null);
  };

  const handleEventClick = (eventId: string) => {
    const actividad = data?.actividades.find((a) => a.id === eventId);
    if (actividad) {
      setSelectedActividad(actividad);
      setShowEventDialog(true);
    }
  };

  const actividades = data?.actividades ?? [];
  const mensaje = data?.message;

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream to-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-brand-creamLight bg-white/95 p-5 shadow-sm md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-brand-dark p-2 text-brand-cream">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-title text-2xl text-brand-dark">Calendario de actividades</h1>
              <p className="text-sm text-brand-brown">Consulta tus proximas actividades con tu DNI.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={dni}
                onChange={(event) => setDni(event.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                placeholder="Ej: 35123456"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBuscar();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="desde">Desde (opcional)</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta (opcional)</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <Button
              className="w-full bg-brand-brown text-white hover:bg-brand-dark md:w-auto"
              disabled={isLoading || !dni.trim()}
              onClick={handleBuscar}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Buscando...' : 'Consultar actividades'}
            </Button>
          </div>

          {isError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error instanceof Error ? error.message : 'No se pudo consultar el calendario'}
            </p>
          )}
          {mensaje && (
            <p className="mt-4 rounded-lg bg-brand-cream p-3 text-sm text-brand-brown">{mensaje}</p>
          )}
        </section>

        {hasSearched && (
          <>
            {isLoading ? (
              <section className="flex min-h-[400px] items-center justify-center rounded-2xl border border-brand-creamLight bg-white/95 p-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-brown" />
                  <p className="text-sm text-brand-brown">Cargando calendario...</p>
                </div>
              </section>
            ) : actividades.length === 0 ? (
              <section className="flex min-h-[200px] items-center justify-center rounded-2xl border border-brand-creamLight bg-white/95 p-8">
                <div className="text-center">
                  <CalendarDays className="mx-auto h-12 w-12 text-brand-brown/40" />
                  <p className="mt-4 text-lg text-brand-brown">No encontramos actividades para los datos ingresados.</p>
                  <p className="mt-2 text-sm text-brand-brown/60">
                    Verificá que el DNI sea correcto o probá con otro rango de fechas.
                  </p>
                </div>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-brand-creamLight bg-white/95 p-4 shadow-sm md:p-6">
                  <CalendarioVista
                    eventos={actividades}
                    isLoading={isLoading}
                    onEventClick={handleEventClick}
                  />
                </section>

                <section className="rounded-2xl border border-brand-creamLight bg-white/95 p-5 shadow-sm md:p-6">
                  <h2 className="mb-4 font-title text-xl text-brand-dark">Todas las actividades</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {actividades.map((actividad) => (
                      <CalendarioEventCard
                        key={actividad.id}
                        actividad={actividad}
                        onClick={handleEventClick}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-title text-xl text-brand-dark">
              {selectedActividad?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedActividad && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-brown/70">
                  {CALENDARIO_ORIGEN_LABEL[selectedActividad.origen_tipo]}
                </p>
                <p className="mt-1 text-sm text-brand-brown">{selectedActividad.tipo}</p>
              </div>

              <div className="border-t border-brand-creamLight pt-3">
                <p className="text-sm font-medium text-brand-dark">Fecha</p>
                <p className="mt-1 text-sm text-brand-brown">
                  {new Date(`${selectedActividad.fecha_inicio}T00:00:00`).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {selectedActividad.fecha_fin &&
                    ` - ${new Date(`${selectedActividad.fecha_fin}T00:00:00`).toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}`}
                </p>
              </div>

              {selectedActividad.descripcion && (
                <div className="border-t border-brand-creamLight pt-3">
                  <p className="text-sm font-medium text-brand-dark">Descripcion</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-brown">
                    {selectedActividad.descripcion}
                  </p>
                </div>
              )}

              {selectedActividad.estado === 'cancelado' && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">Esta actividad ha sido cancelada</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
