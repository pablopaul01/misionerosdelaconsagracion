'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CalendarDays, Loader2, ArrowLeft } from 'lucide-react';
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
import type { ActividadCalendario } from '@/types/calendario';

import '@/styles/calendario-fullcalendar.css';

export const dynamic = 'force-dynamic';

type Estado = 'login' | 'calendario' | 'no-encontrado';

interface MisioneroInfo {
  nombre: string;
  apellido: string;
}

export default function CalendarioMisioneroPage() {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('login');
  const [misioneroInfo, setMisioneroInfo] = useState<MisioneroInfo | null>(null);

  const { data, isLoading, isError, error } = useCalendarioMisionero({
    dni,
    desde: '',
    hasta: '',
  });

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadCalendario | null>(null);

  const handleBuscar = () => {
    if (!dni.trim()) return;
    setEstado('calendario');
    setMisioneroInfo(null);
  };

  const handleEventClick = (eventId: string) => {
    const actividad = data?.actividades.find((a) => a.id === eventId);
    if (actividad) {
      setSelectedActividad(actividad);
      setShowEventDialog(true);
    }
  };

  const handleVolver = () => {
    setEstado('login');
    setDni('');
    setMisioneroInfo(null);
  };

  const actividades = data?.actividades ?? [];

  // ── PANTALLA DE LOGIN ────────────────────────────────────────────────────────
  if (estado === 'login') {
    return (
      <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <Image
            src="/logomisioneros.png"
            alt="Logo"
            width={160}
            height={160}
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="font-title text-brand-dark text-xl tracking-wide mb-2">
              Calendario de actividades
            </h1>
            <p className="text-sm text-brand-brown">
              Consultá tus proximas actividades con tu DNI
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dni">Ingresá tu DNI</Label>
              <Input
                id="dni"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 35123456"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                className="text-lg"
              />
            </div>
            <Button
              onClick={handleBuscar}
              disabled={!dni.trim()}
              className="bg-brand-brown hover:bg-brand-dark text-white font-title tracking-wide"
            >
              Ver mi calendario
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ── PANTALLA DE CALENDARIO ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream to-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-brand-creamLight bg-white/95 p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-dark p-2 text-brand-cream">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-title text-2xl text-brand-dark">Calendario de actividades</h1>
                <p className="text-sm text-brand-brown">
                  {misioneroInfo
                    ? `${misioneroInfo.apellido}, ${misioneroInfo.nombre}`
                    : `DNI: ${dni}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleVolver}
              className="text-brand-brown hover:text-brand-dark"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cambiar DNI
            </Button>
          </div>

          {isError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error instanceof Error ? error.message : 'No se pudo consultar el calendario'}
            </p>
          )}
          {data?.message && (
            <p className="mt-4 rounded-lg bg-brand-cream p-3 text-sm text-brand-brown">
              {data.message}
            </p>
          )}
        </section>

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
              <p className="mt-4 text-lg text-brand-brown">
                No encontramos actividades para los datos ingresados.
              </p>
              <p className="mt-2 text-sm text-brand-brown/60">
                Verificá que el DNI sea correcto o probá con otro rango de fechas.
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-creamLight bg-white/95 p-4 shadow-sm md:p-6">
            <CalendarioVista
              eventos={actividades}
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          </section>
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
