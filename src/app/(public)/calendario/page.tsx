'use client';

import { useState } from 'react';
import { CalendarDays, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CALENDARIO_ORIGEN_LABEL } from '@/lib/constants/calendario';

type ActividadPublica = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  origen_tipo: keyof typeof CALENDARIO_ORIGEN_LABEL;
};

export const dynamic = 'force-dynamic';

export default function CalendarioMisioneroPage() {
  const [dni, setDni] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actividades, setActividades] = useState<ActividadPublica[]>([]);

  const buscar = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/calendario/misionero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dni, desde: desde || undefined, hasta: hasta || undefined }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo consultar el calendario');
      }

      setActividades(payload.actividades ?? []);
      setMessage(payload.message ?? null);
    } catch (requestError) {
      setError((requestError as Error).message);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream to-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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
              />
            </div>
            <div>
              <Label htmlFor="desde">Desde (opcional)</Label>
              <Input id="desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta (opcional)</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <Button
              className="w-full bg-brand-brown text-white hover:bg-brand-dark md:w-auto"
              disabled={loading || !dni.trim()}
              onClick={buscar}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? 'Buscando...' : 'Consultar actividades'}
            </Button>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-4 rounded-lg bg-brand-cream p-3 text-sm text-brand-brown">{message}</p>}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {actividades.map((actividad) => (
            <article key={actividad.id} className="rounded-2xl border border-brand-creamLight bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-brown/70">
                {CALENDARIO_ORIGEN_LABEL[actividad.origen_tipo]}
              </p>
              <h2 className="mt-1 font-title text-lg text-brand-dark">{actividad.titulo}</h2>
              <p className="mt-1 text-sm text-brand-brown">{actividad.tipo}</p>
              <p className="mt-3 text-sm text-brand-brown/90">
                {new Date(`${actividad.fecha_inicio}T00:00:00`).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                {actividad.fecha_fin
                  ? ` - ${new Date(`${actividad.fecha_fin}T00:00:00`).toLocaleDateString('es-AR')}`
                  : ''}
              </p>
              {actividad.descripcion && (
                <p className="mt-3 border-t border-brand-creamLight pt-3 text-sm leading-relaxed text-brand-brown/80">
                  {actividad.descripcion}
                </p>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
