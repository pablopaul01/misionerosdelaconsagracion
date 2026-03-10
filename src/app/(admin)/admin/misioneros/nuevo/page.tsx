'use client';

import { useRouter } from 'next/navigation';
import { MisioneroForm } from '@/components/misioneros/MisioneroForm';
import { useCreateMisionero, useRolesMisioneroActivos, useSetMisioneroRoles } from '@/lib/queries/misioneros';
import { Button } from '@/components/ui/button';

export default function NuevoMisioneroPage() {
  const router = useRouter();
  const { mutateAsync: createMisionero } = useCreateMisionero();
  const setMisioneroRoles = useSetMisioneroRoles();
  const { data: rolesActivos = [] } = useRolesMisioneroActivos();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/admin/misioneros');
  };

  const handleSubmit = async (value: Parameters<typeof createMisionero>[0], roleIds: string[]) => {
    const created = await createMisionero(value);
    await setMisioneroRoles.mutateAsync({ misioneroId: created.id, roleIds });
    router.push('/admin/misioneros');
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

      <MisioneroForm onSubmit={handleSubmit} submitLabel="Registrar" roles={rolesActivos} />
    </div>
  );
}
