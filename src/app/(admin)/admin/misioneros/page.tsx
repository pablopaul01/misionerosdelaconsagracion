'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MisioneroTable } from '@/components/misioneros/MisioneroTable';
import {
  useRolesMisionero,
  useCreateRolMisionero,
  useUpdateRolMisionero,
  useDeleteRolMisionero,
} from '@/lib/queries/misioneros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function MisionerosPage() {
  const router = useRouter();
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolAEliminar, setRolAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '', activo: true });
  const { data: roles = [], isLoading: loadingRoles } = useRolesMisionero();
  const createRol = useCreateRolMisionero();
  const updateRol = useUpdateRolMisionero();
  const deleteRol = useDeleteRolMisionero();


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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Misioneros</h1>

        <div className="flex items-center gap-2">
          <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Gestionar roles</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-title text-brand-dark">Roles de misionero</DialogTitle>
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
                      <div key={rol.id} className="border border-brand-creamLight rounded-lg p-3 flex items-start justify-between gap-3">
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

          <Button className="bg-brand-brown hover:bg-brand-dark text-white" onClick={() => router.push('/admin/misioneros/nuevo')}>
            + Nuevo misionero
          </Button>
        </div>
      </div>

      <MisioneroTable />

      <AlertDialog open={!!rolAEliminar} onOpenChange={(open) => !open && setRolAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el rol <strong>{rolAEliminar?.nombre}</strong>. Esta acción no se puede deshacer.
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
