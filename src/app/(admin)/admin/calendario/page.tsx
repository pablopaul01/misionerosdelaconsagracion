'use client';

import { useEffect, useMemo, useState } from 'react';

const ITEMS_POR_PAGINA = 12;
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  CALENDARIO_ESTADO,
  CALENDARIO_ORIGEN,
  CALENDARIO_ORIGEN_LABEL,
} from '@/lib/constants/calendario';
import {
  useCalendarioAdmin,
  useCreateActividadCalendario,
  useDeleteActividadCalendario,
  useUpdateActividadCalendario,
} from '@/lib/queries/calendario';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

type ActividadFormState = {
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  estado: 'activo' | 'cancelado';
  nota_admin: string;
};

type ActividadCalendario = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  estado: 'activo' | 'cancelado';
  origen_tipo: keyof typeof CALENDARIO_ORIGEN_LABEL;
  sincronizado: boolean;
  nota_admin: string | null;
};

const EMPTY_FORM: ActividadFormState = {
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  tipo: '',
  estado: CALENDARIO_ESTADO.ACTIVO,
  nota_admin: '',
};

export const dynamic = 'force-dynamic';

export default function AdminCalendarioPage() {
  const [origenFiltro, setOrigenFiltro] = useState<'todos' | string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | string>('todos');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [pagina, setPagina] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<ActividadCalendario | null>(null);
  const [toDelete, setToDelete] = useState<ActividadCalendario | null>(null);
  const [formState, setFormState] = useState<ActividadFormState>(EMPTY_FORM);

  const filters = useMemo(
    () => ({
      origen_tipo: origenFiltro === 'todos' ? undefined : origenFiltro,
      estado: estadoFiltro === 'todos' ? undefined : estadoFiltro,
      tipo: tipoFiltro || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    }),
    [origenFiltro, estadoFiltro, tipoFiltro, desde, hasta],
  );

  const { data: actividades = [], isLoading } = useCalendarioAdmin(filters);

  useEffect(() => { setPagina(1); }, [filters]);

  const totalPaginas = Math.ceil(actividades.length / ITEMS_POR_PAGINA);
  const actividadesPaginadas = actividades.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);
  const createActividad = useCreateActividadCalendario();
  const updateActividad = useUpdateActividadCalendario();
  const deleteActividad = useDeleteActividadCalendario();

  const openCreate = () => {
    setEditing(null);
    setFormState(EMPTY_FORM);
    setOpenForm(true);
  };

  const openEdit = (actividad: ActividadCalendario) => {
    setEditing(actividad);
    setFormState({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion ?? '',
      fecha_inicio: actividad.fecha_inicio,
      fecha_fin: actividad.fecha_fin ?? '',
      tipo: actividad.tipo,
      estado: actividad.estado,
      nota_admin: actividad.nota_admin ?? '',
    });
    setOpenForm(true);
  };

  const submitForm = async () => {
    try {
      if (!editing) {
        await createActividad.mutateAsync({
          titulo: formState.titulo,
          descripcion: formState.descripcion || null,
          fecha_inicio: formState.fecha_inicio,
          fecha_fin: formState.fecha_fin || null,
          tipo: formState.tipo,
          estado: formState.estado,
          nota_admin: formState.nota_admin || null,
        });
        toast.success('Actividad creada');
      } else {
        await updateActividad.mutateAsync({
          id: editing.id,
          input: editing.sincronizado
            ? {
                descripcion: formState.descripcion || null,
                estado: formState.estado,
                nota_admin: formState.nota_admin || null,
              }
            : {
                titulo: formState.titulo,
                descripcion: formState.descripcion || null,
                fecha_inicio: formState.fecha_inicio,
                fecha_fin: formState.fecha_fin || null,
                tipo: formState.tipo,
                estado: formState.estado,
                nota_admin: formState.nota_admin || null,
              },
        });
        toast.success('Actividad actualizada');
      }
      setOpenForm(false);
      setEditing(null);
      setFormState(EMPTY_FORM);
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;

    try {
      await deleteActividad.mutateAsync(toDelete.id);
      toast.success(toDelete.sincronizado ? 'Actividad desactivada' : 'Actividad eliminada');
    } catch (deleteError) {
      toast.error((deleteError as Error).message);
    } finally {
      setToDelete(null);
    }
  };

  const isPending =
    createActividad.isPending || updateActividad.isPending || deleteActividad.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Calendario</h1>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-brand-brown text-white hover:bg-brand-dark">
              <Plus className="mr-2 h-4 w-4" />
              Nueva actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">
                {editing ? 'Editar actividad' : 'Nueva actividad'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Titulo</Label>
                <Input
                  value={formState.titulo}
                  disabled={editing?.sincronizado}
                  onChange={(event) => setFormState((prev) => ({ ...prev, titulo: event.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Descripcion</Label>
                <Textarea
                  value={formState.descripcion}
                  onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    disabled={editing?.sincronizado}
                    value={formState.fecha_inicio}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, fecha_inicio: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    disabled={editing?.sincronizado}
                    value={formState.fecha_fin}
                    onChange={(event) => setFormState((prev) => ({ ...prev, fecha_fin: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Input
                    disabled={editing?.sincronizado}
                    value={formState.tipo}
                    onChange={(event) => setFormState((prev) => ({ ...prev, tipo: event.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Estado</Label>
                  <Select
                    value={formState.estado}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, estado: value as 'activo' | 'cancelado' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CALENDARIO_ESTADO.ACTIVO}>Activo</SelectItem>
                      <SelectItem value={CALENDARIO_ESTADO.CANCELADO}>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Nota administrativa</Label>
                <Textarea
                  value={formState.nota_admin}
                  onChange={(event) => setFormState((prev) => ({ ...prev, nota_admin: event.target.value }))}
                  rows={2}
                />
              </div>
              <Button onClick={submitForm} disabled={isPending} className="bg-brand-brown text-white hover:bg-brand-dark">
                {isPending ? 'Guardando...' : 'Guardar actividad'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-creamLight bg-white p-4 md:grid-cols-5">
        <div>
          <Label>Origen</Label>
          <Select value={origenFiltro} onValueChange={setOrigenFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.values(CALENDARIO_ORIGEN).map((origen) => (
                <SelectItem key={origen} value={origen}>
                  {CALENDARIO_ORIGEN_LABEL[origen]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value={CALENDARIO_ESTADO.ACTIVO}>Activo</SelectItem>
              <SelectItem value={CALENDARIO_ESTADO.CANCELADO}>Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo</Label>
          <Input value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} />
        </div>
        <div>
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-brand-brown">Cargando calendario...</p>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {actividadesPaginadas.map((actividad) => (
            <article key={actividad.id} className="rounded-xl border border-brand-creamLight bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-title text-lg text-brand-dark">{actividad.titulo}</h2>
                  <p className="text-sm text-brand-brown">{actividad.tipo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={actividad.sincronizado ? 'bg-brand-navy text-white' : 'bg-brand-brown text-white'}>
                    {actividad.sincronizado ? 'Sincronizada' : 'Manual'}
                  </Badge>
                  <Badge className={actividad.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {actividad.estado}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-brand-brown">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(`${actividad.fecha_inicio}T00:00:00`).toLocaleDateString('es-AR')}
                </span>
                <span>{CALENDARIO_ORIGEN_LABEL[actividad.origen_tipo]}</span>
              </div>

              {actividad.descripcion && <p className="mt-3 text-sm text-brand-brown/90">{actividad.descripcion}</p>}

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-brand-creamLight pt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(actividad)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 hover:bg-red-50"
                  onClick={() => setToDelete(actividad)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {actividad.sincronizado ? 'Desactivar' : 'Eliminar'}
                </Button>
              </div>
            </article>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-brand-brown">
              {actividades.length} actividades · página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina === 1}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina === totalPaginas}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
        </>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toDelete?.sincronizado ? 'Desactivar actividad sincronizada' : 'Eliminar actividad'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.sincronizado
                ? 'Se marcara como cancelada y podra reactivarse por sincronizacion futura.'
                : 'Esta accion elimina la actividad manual de forma permanente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
