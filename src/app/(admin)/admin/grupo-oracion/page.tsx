'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useCrearGrupoOracion,
  useGruposOracion,
  useActivarGrupoOracion,
  useDesactivarGrupoOracion,
  useAsistenciasGrupoOracionCounts,
} from '@/lib/queries/grupo-oracion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, Copy, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { exportarListaAsistencia } from '@/lib/utils/exportExcel';

export default function GrupoOracionPage() {
  const { data: grupos = [], isLoading } = useGruposOracion();
  const { mutateAsync: crearGrupo, isPending: creando } = useCrearGrupoOracion();
  const { mutateAsync: activarGrupo, isPending: activando } = useActivarGrupoOracion();
  const { mutateAsync: desactivarGrupo, isPending: desactivando } = useDesactivarGrupoOracion();
  const router = useRouter();
  const supabase = createClient();
  const [fecha, setFecha] = useState('');
  const [copied, setCopied] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [crearOpen, setCrearOpen] = useState(false);
  const [anioFiltro, setAnioFiltro] = useState('todos');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleCrear = async () => {
    if (!fecha) return;
    try {
      await crearGrupo(fecha);
      setFecha('');
      toast.success('Grupo de oración creado');
    } catch {
      toast.error('Error al crear');
    }
  };

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/grupo-oracion`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportar = async (grupoId: string, fechaGrupo: string) => {
    try {
      const { data, error } = await supabase
        .from('asistencias_grupo_oracion')
        .select('misioneros(apellido, nombre, dni)')
        .eq('grupo_id', grupoId);
      if (error) throw error;

      const filas = (data ?? [])
        .map((row) => ({
          apellido: row.misioneros?.apellido ?? '',
          nombre: row.misioneros?.nombre ?? '',
          dni: row.misioneros?.dni ?? '',
        }))
        .filter((row) => row.apellido || row.nombre);

      exportarListaAsistencia(
        filas,
        `grupo_oracion_${fechaGrupo}`,
        `Grupo de oración ${new Date(fechaGrupo + 'T00:00:00').toLocaleDateString('es-AR')}`,
        false,
      );
    } catch {
      toast.error('Error al exportar');
    }
  };

  const aniosDisponibles = Array.from(
    new Set(grupos.map((g) => g.fecha?.slice(0, 4)).filter(Boolean)),
  ).sort((a, b) => b.localeCompare(a));

  const gruposFiltrados = grupos.filter((grupo) => {
    if (desde && grupo.fecha < desde) return false;
    if (hasta && grupo.fecha > hasta) return false;
    if (anioFiltro !== 'todos' && grupo.fecha.slice(0, 4) !== anioFiltro) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(gruposFiltrados.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const gruposPaginados = gruposFiltrados.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  useEffect(() => {
    setPage(1);
  }, [desde, hasta, anioFiltro]);

  const { data: counts = {} } = useAsistenciasGrupoOracionCounts(gruposPaginados.map((g) => g.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-2xl text-brand-dark">Grupo de oración</h1>
        <p className="text-sm text-brand-brown">Creá un encuentro por fecha y activalo para registrar asistencia.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white w-fit">
              + Crear grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Crear grupo de oración</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-brand-dark">Fecha del grupo</span>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <Button
                onClick={async () => {
                  await handleCrear();
                  setCrearOpen(false);
                }}
                disabled={!fecha || creando}
                className="bg-brand-brown hover:bg-brand-dark text-white"
              >
                {creando ? 'Creando...' : 'Crear grupo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <details className="bg-white rounded-xl border border-brand-creamLight p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-dark">Filtros</summary>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-brand-dark">Desde</span>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-brand-dark">Hasta</span>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-brand-dark">Año</span>
              <select
                className="h-10 rounded-md border border-brand-creamLight bg-white px-3 text-sm"
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value)}
              >
                <option value="todos">Todos</option>
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <Button variant="ghost" className="text-brand-brown w-fit" onClick={() => { setDesde(''); setHasta(''); }}>
              Limpiar filtros
            </Button>
          </div>
        </details>
        <div className="flex items-center justify-between">
          <h2 className="font-title text-brand-dark">Grupos creados</h2>
        <button
          onClick={handleCopiarLink}
          className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy transition-colors"
        >
          {copied ? <><Check className="w-4 h-4" />Copiado</> : <><Copy className="w-4 h-4" />Copiar link</>}
        </button>
        </div>
      </div>

      {isLoading && <p className="text-brand-brown">Cargando...</p>}

      <div className="flex flex-col gap-3">
        {gruposPaginados.map((grupo) => (
          <div
            key={grupo.id}
            className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-title text-brand-dark">
                  {new Date(grupo.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                </span>
                <span className="text-xs text-brand-brown">Viernes</span>
                {grupo.activa ? (
                  <Badge className="bg-brand-gold text-brand-dark mt-2 w-fit">Activa</Badge>
                ) : (
                  <Badge className="bg-brand-creamLight text-brand-brown mt-2 w-fit">Inactiva</Badge>
                )}
                <span className="text-xs text-brand-brown mt-2">
                  Asistencias: {counts[grupo.id] ?? 0}
                </span>
              </div>
              <ActionMenu
                items={[
                  {
                    label: grupo.activa ? 'Desactivar' : 'Activar',
                    onClick: () => (grupo.activa ? desactivarGrupo(grupo.id) : activarGrupo(grupo.id)),
                    tone: grupo.activa ? 'danger' : undefined,
                  },
                  {
                    label: 'Ver asistencias',
                    onClick: () => router.push(`/admin/grupo-oracion/${grupo.id}`),
                  },
                  {
                    label: 'Ver ausentes',
                    onClick: () => router.push(`/admin/grupo-oracion/${grupo.id}/ausentes`),
                  },
                  {
                    label: 'Exportar Excel',
                    onClick: () => handleExportar(grupo.id, grupo.fecha),
                  },
                ]}
                disabled={grupo.activa ? desactivando : activando}
              />
            </div>
          </div>
        ))}

        {!isLoading && gruposFiltrados.length === 0 && (
          <p className="text-brand-brown">No hay grupos creados</p>
        )}
      </div>

      {gruposFiltrados.length > pageSize && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-brand-brown">Página {pageSafe} de {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function ActionMenu({
  items,
  disabled,
}: {
  items: { label: string; onClick: () => void; tone?: 'danger' }[];
  disabled?: boolean;
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
        disabled={disabled}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-brand-creamLight rounded-lg shadow-lg z-50">
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
