'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormaciones, useCreateFormacion } from '@/lib/queries/formaciones';
import { FormacionForm } from '@/components/formaciones/FormacionForm';
import { TIPO_FORMACION_LABEL } from '@/lib/constants/formaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { FormacionInput } from '@/lib/validations/formaciones';

export default function FormacionesPage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: formaciones = [], isLoading } = useFormaciones();
  const { mutateAsync: createFormacion } = useCreateFormacion();

  const handleSubmit = async (value: FormacionInput) => {
    await createFormacion(value);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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

      {isLoading && <p className="text-brand-brown">Cargando...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formaciones.map((formacion) => (
          <button
            key={formacion.id}
            onClick={() => router.push(`/admin/formaciones/${formacion.id}`)}
            className="bg-white border border-brand-creamLight rounded-xl p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-title text-brand-dark text-lg">
                {TIPO_FORMACION_LABEL[formacion.tipo]}
              </span>
              <Badge className="bg-brand-creamLight text-brand-brown">
                {formacion.anio}
              </Badge>
            </div>
            <p className="text-sm text-brand-brown">
              Inicio: {new Date(formacion.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}
            </p>
          </button>
        ))}

        {!isLoading && formaciones.length === 0 && (
          <p className="text-brand-brown col-span-2">No hay formaciones creadas aún</p>
        )}
      </div>
    </div>
  );
}
