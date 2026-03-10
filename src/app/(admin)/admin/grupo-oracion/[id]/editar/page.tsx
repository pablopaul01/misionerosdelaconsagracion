'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGrupoOracion, useUpdateGrupoOracionFecha } from '@/lib/queries/grupo-oracion';

export default function GrupoOracionEditarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: grupo, isLoading } = useGrupoOracion(id);
  const { mutateAsync: updateFecha, isPending } = useUpdateGrupoOracionFecha(id);
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    if (!grupo) return;
    setFecha(grupo.fecha ?? '');
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
            Editar grupo — {new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
          </h1>
          {grupo.activa ? (
            <Badge className="bg-brand-gold text-brand-dark">Activa</Badge>
          ) : (
            <Badge className="bg-brand-creamLight text-brand-brown">Inactiva</Badge>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-dark">Fecha del grupo</span>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <Button
          onClick={async () => {
            try {
              await updateFecha(fecha);
              toast.success('Fecha actualizada');
              router.push('/admin/grupo-oracion');
            } catch {
              toast.error('Error al guardar');
            }
          }}
          disabled={!fecha || isPending}
          className="bg-brand-brown hover:bg-brand-dark text-white"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
