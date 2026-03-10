'use client';

import { useState } from 'react';
import {
  useServidoresRetiro,
  useAddServidor,
  useRemoveServidor,
  useRolesServidor,
  useRolesServidorActivos,
  useCreateRolServidor,
  useUpdateRolServidor,
  useDeleteRolServidor,
  useMisioneros,
} from '@/lib/queries/retiros';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, User } from 'lucide-react';

interface ServidoresTabProps {
  retiroId: string;
}

export function ServidoresTab({ retiroId }: ServidoresTabProps) {
  const [open, setOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolAEliminar, setRolAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [misioneroId, setMisioneroId] = useState('');
  const [rolId, setRolId] = useState('');
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '', activo: true });

  const { data: servidores = [], isLoading } = useServidoresRetiro(retiroId);
  const { data: rolesActivos = [] } = useRolesServidorActivos();
  const { data: roles = [], isLoading: loadingRoles } = useRolesServidor();
  const { data: misioneros = [] } = useMisioneros();

  const addServidor = useAddServidor(retiroId);
  const removeServidor = useRemoveServidor(retiroId);
  const createRol = useCreateRolServidor();
  const updateRol = useUpdateRolServidor();
  const deleteRol = useDeleteRolServidor();

  const handleAdd = async () => {
    if (!misioneroId || !rolId) return;
    try {
      await addServidor.mutateAsync({
        misionero_id: misioneroId,
        rol_id: rolId,
        notas: '',
      });
      setOpen(false);
      setMisioneroId('');
      setRolId('');
      toast.success('Servidor agregado');
    } catch {
      toast.error('Error al agregar servidor');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Eliminar servidor?')) return;
    try {
      await removeServidor.mutateAsync(id);
      toast.success('Servidor eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleCreateRol = async () => {
    if (!nuevoRol.nombre.trim()) {
      toast.error('Ingresá un nombre para el rol');
      return;
    }
    try {
      await createRol.mutateAsync(nuevoRol);
      setNuevoRol({ nombre: '', descripcion: '', activo: true });
      toast.success('Rol creado');
    } catch {
      toast.error('Error al crear rol');
    }
  };

  const handleToggleRol = async (id: string, activo: boolean | null | undefined) => {
    try {
      await updateRol.mutateAsync({ id, input: { activo: !activo } });
      toast.success('Rol actualizado');
    } catch {
      toast.error('Error al actualizar rol');
    }
  };

  const handleDeleteRol = async () => {
    if (!rolAEliminar) return;
    try {
      await deleteRol.mutateAsync(rolAEliminar.id);
      toast.success('Rol eliminado');
      setRolAEliminar(null);
    } catch {
      toast.error('Error al eliminar rol');
      setRolAEliminar(null);
    }
  };

  const misionerosIds = servidores.map((s) => s.misionero_id);
  const disponibles = misioneros?.filter((m) => !misionerosIds.includes(m.id)) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between gap-3">
        <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              Gestionar roles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Roles de servidores</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="rounded-lg border border-brand-creamLight p-4 space-y-3">
                <h4 className="text-sm font-semibold text-brand-dark">Crear nuevo rol</h4>
                <Input
                  placeholder="Nombre del rol"
                  value={nuevoRol.nombre}
                  onChange={(e) => setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))}
                />
                <Textarea
                  placeholder="Descripción"
                  value={nuevoRol.descripcion}
                  onChange={(e) => setNuevoRol((prev) => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-brand-dark">Estado</label>
                  <Select
                    value={nuevoRol.activo ? 'true' : 'false'}
                    onValueChange={(value) => setNuevoRol((prev) => ({ ...prev, activo: value === 'true' }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateRol} disabled={!nuevoRol.nombre.trim()}>
                  Crear rol
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loadingRoles ? (
                  <p className="text-sm text-brand-brown">Cargando roles...</p>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-brand-brown">No hay roles registrados</p>
                ) : (
                  roles.map((rol) => (
                    <div
                      key={rol.id}
                      className="border border-brand-creamLight rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-brand-dark">{rol.nombre}</p>
                        {rol.descripcion && (
                          <p className="text-sm text-brand-brown/80">{rol.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={rol.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {rol.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRol(rol.id, rol.activo)}
                        >
                          {rol.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => setRolAEliminar({ id: rol.id, nombre: rol.nombre })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              Agregar servidor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar servidor</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Misionero</label>
                <Select value={misioneroId} onValueChange={setMisioneroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar misionero" />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibles.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre} {m.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Rol</label>
                <Select value={rolId} onValueChange={setRolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesActivos?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={!misioneroId || !rolId}>
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-brand-brown">Cargando...</p>
        ) : servidores.length === 0 ? (
          <p className="p-4 text-brand-brown">No hay servidores asignados</p>
        ) : (
          <div className="divide-y divide-brand-brown/10">
            {servidores.map((s) => (
              <div key={s.id} className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-brown" />
                  <div>
                    <p className="font-medium text-brand-dark">
                      {s.misioneros?.nombre} {s.misioneros?.apellido}
                    </p>
                    <Badge className="bg-brand-creamLight text-brand-brown text-xs">
                      {s.roles_servidor_retiro?.nombre}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemove(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!rolAEliminar} onOpenChange={(open) => !open && setRolAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el rol <strong>{rolAEliminar?.nombre}</strong>. Los servidores asociados quedarán sin rol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRol}
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
