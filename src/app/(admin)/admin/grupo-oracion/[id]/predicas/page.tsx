'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMisioneros } from '@/lib/queries/misioneros';
import { useGrupoOracion, useUpdateGrupoOracion } from '@/lib/queries/grupo-oracion';

export default function GrupoOracionPredicasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: grupo, isLoading } = useGrupoOracion(id);
  const { data: misioneros = [] } = useMisioneros();
  const misionerosOrdenados = [...misioneros].sort((a, b) => a.apellido.localeCompare(b.apellido));
  const { mutateAsync: updateGrupo, isPending } = useUpdateGrupoOracion(id);

  const [predicaMenorMisioneroId, setPredicaMenorMisioneroId] = useState('none');
  const [predicaMenorSanto, setPredicaMenorSanto] = useState('');
  const [predicaMayorMisioneroId, setPredicaMayorMisioneroId] = useState('none');

  useEffect(() => {
    if (!grupo) return;
    setPredicaMenorMisioneroId(grupo.predica_menor_misionero_id ?? 'none');
    setPredicaMenorSanto(grupo.predica_menor_santo ?? '');
    setPredicaMayorMisioneroId(grupo.predica_mayor_misionero_id ?? 'none');
  }, [grupo]);

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
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
            Predicas — {new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
          </h1>
          {grupo.activa ? (
            <Badge className="bg-brand-gold text-brand-dark">Activa</Badge>
          ) : (
            <Badge className="bg-brand-creamLight text-brand-brown">Inactiva</Badge>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-dark">Predica menor</span>
            <Select value={predicaMenorMisioneroId} onValueChange={setPredicaMenorMisioneroId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar misionero..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {misionerosOrdenados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.apellido}, {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-dark">Santo (predica menor)</span>
            <Input value={predicaMenorSanto} onChange={(e) => setPredicaMenorSanto(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-dark">Predica mayor</span>
            <Select value={predicaMayorMisioneroId} onValueChange={setPredicaMayorMisioneroId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar misionero..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {misionerosOrdenados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.apellido}, {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={async () => {
              try {
                await updateGrupo({
                  predicaMenorMisioneroId: predicaMenorMisioneroId === 'none' ? null : predicaMenorMisioneroId,
                  predicaMenorSanto: predicaMenorSanto || null,
                  predicaMayorMisioneroId: predicaMayorMisioneroId === 'none' ? null : predicaMayorMisioneroId,
                });
                toast.success('Predicación guardada');
              } catch {
                toast.error('Error al guardar');
              }
            }}
            disabled={isPending}
            className="bg-brand-brown hover:bg-brand-dark text-white"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
