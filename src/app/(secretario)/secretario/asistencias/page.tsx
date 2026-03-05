'use client';

import { useState } from 'react';
import { useFormacionesConsagracion } from '@/lib/queries/consagracion';
import { AsistenciasView } from '@/components/consagracion/AsistenciasView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SecretarioAsistenciasPage() {
  const { data: formaciones = [], isLoading } = useFormacionesConsagracion();
  const [formacionId, setFormacionId] = useState<string>('');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-title text-2xl text-brand-dark">Asistencias a la Consagración</h1>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <span className="text-sm font-medium text-brand-dark">Año de formación</span>
        <Select value={formacionId} onValueChange={setFormacionId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar año..." />
          </SelectTrigger>
          <SelectContent>
            {formaciones.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                Consagración {f.anio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formacionId && <AsistenciasView formacionId={formacionId} />}
    </div>
  );
}
