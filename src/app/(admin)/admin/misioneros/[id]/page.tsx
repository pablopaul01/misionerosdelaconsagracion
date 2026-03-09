'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMisionero, useUpdateMisionero, useRolesMisioneroActivos, useMisioneroRoles, useSetMisioneroRoles } from '@/lib/queries/misioneros';
import { MisioneroForm } from '@/components/misioneros/MisioneroForm';
import { Button } from '@/components/ui/button';
import type { MisioneroInput } from '@/lib/validations/misioneros';

export default function MisioneroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: misionero, isLoading } = useMisionero(id);
  const { mutateAsync: updateMisionero } = useUpdateMisionero(id);
  const { data: rolesActivos = [] } = useRolesMisioneroActivos();
  const { data: selectedRoles = [] } = useMisioneroRoles(id);
  const setMisioneroRoles = useSetMisioneroRoles();

  const handleUpdate = async (value: MisioneroInput, roleIds: string[]) => {
    await updateMisionero(value);
    await setMisioneroRoles.mutateAsync({ misioneroId: id, roleIds });
    router.push('/admin/misioneros');
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!misionero) return <p className="text-red-600">Misionero no encontrado</p>;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-brand-brown">
          ← Volver
        </Button>
        <h1 className="font-title text-2xl text-brand-dark">
          {misionero.apellido}, {misionero.nombre}
        </h1>
      </div>

      {/* Formulario de edición con confirmación */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">Datos del misionero</h2>
        <MisioneroForm
          defaultValues={misionero}
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
