'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useMisionero,
  useUpdateMisionero,
  useRolesMisioneroActivos,
  useMisioneroRoles,
  useSetMisioneroRoles,
  useUploadImagenMisionero,
  useUpdateMisioneroImagen,
  useDeleteImagenMisionero,
} from '@/lib/queries/misioneros';
import { MisioneroForm } from '@/components/misioneros/MisioneroForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MisioneroInput } from '@/lib/validations/misioneros';
import { toast } from 'sonner';

export default function MisioneroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: misionero, isLoading } = useMisionero(id);
  const { mutateAsync: updateMisionero } = useUpdateMisionero(id);
  const { mutateAsync: uploadImagen } = useUploadImagenMisionero();
  const { mutateAsync: updateImagen } = useUpdateMisioneroImagen();
  const { mutateAsync: deleteImagen } = useDeleteImagenMisionero();
  const { data: rolesActivos = [] } = useRolesMisioneroActivos();
  const { data: selectedRoles = [] } = useMisioneroRoles(id);
  const setMisioneroRoles = useSetMisioneroRoles();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    if (avatarFile) return;
    if (removeAvatar) {
      setAvatarPreview(null);
      return;
    }
    setAvatarPreview(misionero?.imagen_url ?? null);
  }, [avatarFile, misionero?.imagen_url, removeAvatar]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  const handleUpdate = async (value: MisioneroInput, roleIds: string[]) => {
    try {
      const currentImagenUrl = misionero?.imagen_url ?? null;
      await updateMisionero(value);
      await setMisioneroRoles.mutateAsync({ misioneroId: id, roleIds });
      if (avatarFile) {
        const imagenUrl = await uploadImagen({ file: avatarFile, misioneroId: id });
        if (currentImagenUrl) {
          await deleteImagen({ publicUrl: currentImagenUrl });
        }
        await updateImagen({ misioneroId: id, imagenUrl });
      } else if (removeAvatar && currentImagenUrl) {
        await deleteImagen({ publicUrl: currentImagenUrl });
        await updateImagen({ misioneroId: id, imagenUrl: null });
      }
      toast.success('Misionero actualizado correctamente');
      router.replace('/admin/misioneros');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : null;
      toast.error(errorMessage ?? 'No se pudo actualizar el misionero');
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    setRemoveAvatar(false);
    if (!file) {
      setAvatarFile(null);
      setAvatarObjectUrl(null);
      setAvatarPreview(misionero?.imagen_url ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarObjectUrl(objectUrl);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = () => {
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    setAvatarFile(null);
    setAvatarObjectUrl(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const handleRestoreAvatar = () => {
    setRemoveAvatar(false);
    setAvatarPreview(misionero?.imagen_url ?? null);
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!misionero) return <p className="text-red-600">Misionero no encontrado</p>;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-2xl text-brand-dark">
            {misionero.apellido}, {misionero.nombre}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-brand-creamLight text-brand-brown flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">
                {misionero.apellido.slice(0, 1).toUpperCase()}
                {misionero.nombre.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleAvatarChange(null)}
                disabled={!avatarFile}
              >
                Cancelar
              </Button>
              {removeAvatar ? (
                <Button variant="outline" onClick={handleRestoreAvatar}>
                  Restaurar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={!misionero.imagen_url || !!avatarFile}
                >
                  Eliminar
                </Button>
              )}
            </div>
            <p className="text-xs text-brand-brown/60">
              {removeAvatar
                ? 'La imagen se eliminara al actualizar.'
                : 'La imagen se guarda al actualizar.'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de edición con confirmación */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">Datos del misionero</h2>
        <MisioneroForm
          defaultValues={{
            ...misionero,
            fecha_nacimiento: misionero.fecha_nacimiento ?? '',
            domicilio: misionero.domicilio ?? '',
            fecha_consagracion: misionero.fecha_consagracion ?? '',
            fecha_retiro_conversion: misionero.fecha_retiro_conversion ?? '',
            activo: misionero.activo ?? true,
          }}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
          roles={rolesActivos}
          defaultRoleIds={selectedRoles}
        />
      </div>

      {/* Historial de asistencias — se implementa al construir el módulo de formaciones */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-2">Historial de formaciones</h2>
        <p className="text-sm text-brand-brown/60">Disponible al crear formaciones</p>
      </div>
    </div>
  );
}
