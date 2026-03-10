'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, CheckCircle2 } from 'lucide-react';
import {
  useFormaciones,
  useCreateFormacion,
  useUpdateFormacionCompleta,
  useDeleteFormacion,
} from '@/lib/queries/formaciones';
import { FormacionForm } from '@/components/formaciones/FormacionForm';
import { TIPO_FORMACION, TIPO_FORMACION_LABEL, DIAS_SEMANA } from '@/lib/constants/formaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { FormacionInput } from '@/lib/validations/formaciones';

type Formacion = {
  id: string;
  tipo: 'san_lorenzo' | 'escuela_de_maria';
  anio: number;
  fecha_inicio: string;
  dia_semana: number;
  finalizada: boolean;
};

// ── Dialog editar formación ──────────────────────────────────────────────────

interface EditFormacionDialogProps {
  formacion: Formacion;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EditFormacionDialog = ({ formacion, open, onOpenChange }: EditFormacionDialogProps) => {
  const { mutateAsync: actualizar, isPending } = useUpdateFormacionCompleta(formacion.id);
  const [form, setForm] = useState<FormacionInput>({
    tipo:         formacion.tipo,
    anio:         formacion.anio,
    fecha_inicio: formacion.fecha_inicio,
    dia_semana:   formacion.dia_semana,
  });
  const [error, setError] = useState('');

  const handleOpenChange = (v: boolean) => {
    if (v) setForm({ tipo: formacion.tipo, anio: formacion.anio, fecha_inicio: formacion.fecha_inicio, dia_semana: formacion.dia_semana });
    setError('');
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fecha_inicio) { setError('La fecha de inicio es requerida'); return; }
    try {
      await actualizar(form);
      toast.success('Formación actualizada');
      onOpenChange(false);
    } catch (e) {
      setError((e as Error)?.message ?? 'Error al guardar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-brand-dark">Editar formación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de formación</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as FormacionInput['tipo'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(TIPO_FORMACION).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_FORMACION_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Año</Label>
            <Input
              type="number" min={2020} max={2100}
              value={form.anio}
              onChange={(e) => setForm((p) => ({ ...p, anio: Number(e.target.value) }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Día de clase habitual</Label>
            <Select value={String(form.dia_semana)} onValueChange={(v) => setForm((p) => ({ ...p, dia_semana: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIAS_SEMANA.map((dia, i) => (
                  <SelectItem key={i} value={String(i)}>{dia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="bg-brand-brown hover:bg-brand-dark text-white">
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Página ───────────────────────────────────────────────────────────────────

export default function FormacionesPage() {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Formacion | null>(null);
  const [eliminando, setEliminando] = useState<Formacion | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | Formacion['tipo']>('todos');
  const [anioFiltro, setAnioFiltro] = useState<'todos' | string>('todos');
  const router = useRouter();

  const { data: formaciones = [], isLoading } = useFormaciones();
  const { mutateAsync: createFormacion } = useCreateFormacion();
  const { mutateAsync: deleteFormacion, isPending: eliminandoPending } = useDeleteFormacion();

  const aniosDisponibles = Array.from(
    new Set(formaciones.map((f) => String(f.anio)))
  ).sort((a, b) => b.localeCompare(a));

  const formacionesFiltradas = formaciones.filter((f) => {
    const coincideTipo = tipoFiltro === 'todos' || f.tipo === tipoFiltro;
    const coincideAnio = anioFiltro === 'todos' || String(f.anio) === anioFiltro;
    return coincideTipo && coincideAnio;
  });

  const copyLink = (formacionId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/asistencia`);
    setCopiedId(formacionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (value: FormacionInput) => {
    await createFormacion(value);
    setOpen(false);
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await deleteFormacion(eliminando.id);
      toast.success('Formación eliminada');
      setEliminando(null);
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Error al eliminar');
      setEliminando(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Formaciones de Misioneros</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              + Nueva formación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Nueva formación</DialogTitle>
            </DialogHeader>
            <FormacionForm onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <Label>Filtrar por tipo</Label>
          <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as 'todos' | Formacion['tipo'])}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.values(TIPO_FORMACION).map((value) => (
                <SelectItem key={value} value={value}>
                  {TIPO_FORMACION_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <Label>Filtrar por año</Label>
          <Select value={anioFiltro} onValueChange={setAnioFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {aniosDisponibles.map((anio) => (
                <SelectItem key={anio} value={anio}>{anio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-brand-brown">Cargando...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formacionesFiltradas.map((formacion) => (
          <div
            key={formacion.id}
            className="bg-white border border-brand-creamLight rounded-xl p-5 flex flex-col gap-3"
          >
            {/* Cuerpo — clickeable para ir al detalle */}
            <button
              onClick={() => router.push(`/admin/formaciones/${formacion.id}`)}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="font-title text-brand-dark text-lg">
                  {TIPO_FORMACION_LABEL[formacion.tipo]}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {formacion.finalizada && (
                    <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Finalizada
                    </span>
                  )}
                  <Badge className="bg-brand-creamLight text-brand-brown">
                    {formacion.anio}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-brand-brown">
                Inicio: {new Date(formacion.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}
              </p>
              <p className="text-xs text-brand-brown/70">
                {DIAS_SEMANA[formacion.dia_semana]}s
              </p>
            </button>

            {/* Acciones */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => copyLink(formacion.id)}
                className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy transition-colors"
              >
                {copiedId === formacion.id
                  ? <><Check className="w-4 h-4" />Copiado</>
                  : <><Copy className="w-4 h-4" />Copiar link</>
                }
              </button>

              <button
                onClick={() => setEditTarget(formacion as Formacion)}
                className="text-sm text-brand-brown hover:text-brand-dark transition-colors"
              >
                Editar
              </button>

              <button
                onClick={() => setEliminando(formacion as Formacion)}
                className="text-sm text-red-400 hover:text-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {!isLoading && formacionesFiltradas.length === 0 && (
          <p className="text-brand-brown col-span-2">No hay formaciones creadas aún</p>
        )}
      </div>

      {/* Dialog editar */}
      {editTarget && (
        <EditFormacionDialog
          key={editTarget.id}
          formacion={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        />
      )}

      {/* AlertDialog eliminar */}
      <AlertDialog open={!!eliminando} onOpenChange={(v) => { if (!v) setEliminando(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar formación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{eliminando ? TIPO_FORMACION_LABEL[eliminando.tipo] : ''} {eliminando?.anio}</strong>.
              Solo se puede eliminar si no tiene clases asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminandoPending}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
