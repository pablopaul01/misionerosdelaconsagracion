'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_ROLES } from '@/lib/constants/roles';
import { fieldError } from '@/lib/utils/form';
import { crearUsuario, listarUsuarios, eliminarUsuario } from './actions';

const ROLE_LABEL: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.SECRETARIO_CONSAGRACION]: 'Secretario de Consagración',
};

const crearUsuarioSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre:   z.string().min(1, 'El nombre es requerido'),
  role:     z.enum([USER_ROLES.ADMIN, USER_ROLES.SECRETARIO_CONSAGRACION]),
});

type Usuario = { id: string; nombre: string; role: string; email: string };

const NuevoUsuarioForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [error, setError] = useState('');
  const form = useForm({
    defaultValues: {
      email:    '',
      password: '',
      nombre:   '',
      role:     USER_ROLES.SECRETARIO_CONSAGRACION as 'admin' | 'secretario_consagracion',
    },
    validators: { onSubmit: crearUsuarioSchema },
    onSubmit: async ({ value }) => {
      setError('');
      const result = await crearUsuario(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
      className="flex flex-col gap-4"
    >
      <form.Field name="nombre">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Rol</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as 'admin' | 'secretario_consagracion')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={USER_ROLES.SECRETARIO_CONSAGRACION}>
                  Secretario de Consagración
                </SelectItem>
                <SelectItem value={USER_ROLES.ADMIN}>Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white"
          >
            {isSubmitting ? 'Creando...' : 'Crear usuario'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};

export default function UsuariosPage() {
  const [open, setOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Usuario | null>(null);
  const [isPending, startTransition] = useTransition();

  const cargar = () => {
    setLoading(true);
    listarUsuarios().then((result) => {
      if (result.usuarios) setUsuarios(result.usuarios);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  const handleEliminar = () => {
    if (!confirmarEliminar) return;
    startTransition(async () => {
      await eliminarUsuario(confirmarEliminar.id);
      setConfirmarEliminar(null);
      cargar();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-brand-dark">Usuarios del sistema</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              + Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Nuevo usuario</DialogTitle>
            </DialogHeader>
            <NuevoUsuarioForm onSuccess={() => { setOpen(false); cargar(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-brand-brown">Cargando...</p>}

      {!loading && (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="hidden md:block rounded-xl border border-brand-creamLight overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-creamLight">
                <tr>
                  <th className="px-4 py-3 text-left font-title text-brand-dark">Nombre</th>
                  <th className="px-4 py-3 text-left font-title text-brand-dark">Email</th>
                  <th className="px-4 py-3 text-left font-title text-brand-dark">Rol</th>
                  <th className="px-4 py-3 text-left font-title text-brand-dark"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-brand-creamLight hover:bg-brand-cream/30">
                    <td className="px-4 py-3 font-medium text-brand-dark">{u.nombre}</td>
                    <td className="px-4 py-3 text-brand-brown">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.role === USER_ROLES.ADMIN
                            ? 'bg-brand-navy text-white'
                            : 'bg-brand-teal text-white'
                        }
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setConfirmarEliminar(u)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-brand-brown">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="md:hidden flex flex-col gap-3">
            {usuarios.length === 0 && (
              <p className="text-center text-brand-brown py-6">No hay usuarios registrados</p>
            )}
            {usuarios.map((u) => (
              <div key={u.id} className="bg-white border border-brand-creamLight rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-title text-brand-dark font-semibold">{u.nombre}</p>
                  <p className="text-xs text-brand-brown truncate">{u.email}</p>
                  <Badge
                    className={`mt-1 w-fit ${
                      u.role === USER_ROLES.ADMIN
                        ? 'bg-brand-navy text-white'
                        : 'bg-brand-teal text-white'
                    }`}
                  >
                    {ROLE_LABEL[u.role] ?? u.role}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 shrink-0"
                  onClick={() => setConfirmarEliminar(u)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <AlertDialog
        open={!!confirmarEliminar}
        onOpenChange={(open) => { if (!open) setConfirmarEliminar(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente al usuario{' '}
              <strong>{confirmarEliminar?.nombre}</strong> ({confirmarEliminar?.email}).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700 text-white"
              onClick={handleEliminar}
              disabled={isPending}
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
