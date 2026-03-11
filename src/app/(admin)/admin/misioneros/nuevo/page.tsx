'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MisioneroForm } from '@/components/misioneros/MisioneroForm';
import {
  useCreateMisionero,
  useRolesMisioneroActivos,
  useSetMisioneroRoles,
  useUploadImagenMisionero,
  useUpdateMisioneroImagen,
} from '@/lib/queries/misioneros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NuevoMisioneroPage() {
  const router = useRouter();
  const { mutateAsync: createMisionero } = useCreateMisionero();
  const { mutateAsync: uploadImagen } = useUploadImagenMisionero();
  const { mutateAsync: updateImagen } = useUpdateMisioneroImagen();
  const setMisioneroRoles = useSetMisioneroRoles();
  const { data: rolesActivos = [] } = useRolesMisioneroActivos();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/admin/misioneros');
  };

  const handleSubmit = async (value: Parameters<typeof createMisionero>[0], roleIds: string[]) => {
    try {
      const created = await createMisionero(value);
      await setMisioneroRoles.mutateAsync({ misioneroId: created.id, roleIds });
      if (avatarFile) {
        const imagenUrl = await uploadImagen({ file: avatarFile, misioneroId: created.id });
        await updateImagen({ misioneroId: created.id, imagenUrl });
      }
      router.push('/admin/misioneros');
    } catch {
      toast.error('No se pudo registrar el misionero');
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    if (!file) {
      setAvatarFile(null);
      setAvatarObjectUrl(null);
      setAvatarPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarObjectUrl(objectUrl);
    setAvatarPreview(objectUrl);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={handleBack} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-2xl text-brand-dark">Registrar misionero</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-brand-creamLight text-brand-brown flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">MC</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              className="max-w-xs"
            />
            <p className="text-xs text-brand-brown/60">La imagen se sube al registrar.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">Datos del misionero</h2>
        <MisioneroForm onSubmit={handleSubmit} submitLabel="Registrar" roles={rolesActivos} />
      </div>
    </div>
  );
}
