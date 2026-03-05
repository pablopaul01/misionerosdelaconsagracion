'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useFormacionesConsagracion } from '@/lib/queries/consagracion';
import { InscripcionesView } from '@/components/consagracion/InscripcionesView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SecretarioInscripcionesPage() {
  const { data: formaciones = [], isLoading } = useFormacionesConsagracion();
  const [formacionId, setFormacionId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const formacionSeleccionada = formaciones.find((f) => f.id === formacionId);

  const copyLink = () => {
    if (!formacionSeleccionada) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/consagracion/inscripcion/${formacionSeleccionada.anio}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-title text-2xl text-brand-dark">Inscripciones a la Consagración</h1>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex flex-col gap-1.5 sm:max-w-xs w-full">
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
        {formacionSeleccionada && (
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy transition-colors"
          >
            {copied ? <><Check className="w-4 h-4" />Copiado</> : <><Copy className="w-4 h-4" />Copiar link de inscripción</>}
          </button>
        )}
      </div>

      {formacionSeleccionada && <InscripcionesView formacionId={formacionSeleccionada.id} />}
    </div>
  );
}
