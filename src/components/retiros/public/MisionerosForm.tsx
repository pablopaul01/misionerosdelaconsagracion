'use client';

import { useState } from 'react';
import { useLookupMisioneroPorDni, useCreateInscripcionMisionero } from '@/lib/queries/retiros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Check } from 'lucide-react';

interface MisionerosFormProps {
  retiroId: string;
}

export function MisionerosForm({ retiroId }: MisionerosFormProps) {
  const [dni, setDni] = useState('');
  const [misionero, setMisionero] = useState<{ id: string; nombre: string; apellido: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const lookup = useLookupMisioneroPorDni();
  const createInscripcion = useCreateInscripcionMisionero(retiroId);

  const handleSearch = async () => {
    if (!dni || dni.length < 7) return;
    try {
      const data = await lookup.mutateAsync(dni);
      setMisionero(data);
    } catch {
      toast.error('Misionero no encontrado');
      setMisionero(null);
    }
  };

  const handleSubmit = async () => {
    if (!misionero) return;
    try {
      await createInscripcion.mutateAsync(misionero.id);
      setSuccess(true);
    } catch {
      toast.error('Error al inscribir');
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-title text-2xl text-brand-dark">¡Inscripción realizada!</h2>
        <p className="text-brand-brown">Tu inscripción quedó registrada correctamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="Ingresa tu DNI"
          className="min-h-[48px]"
          maxLength={8}
        />
        <Button onClick={handleSearch} disabled={lookup.isPending} className="bg-brand-brown hover:bg-brand-dark">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      {misionero && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                {misionero.nombre} {misionero.apellido}
              </p>
              <p className="text-sm text-green-600">Misionero encontrado</p>
            </div>
          </div>
        </div>
      )}

      {misionero && (
        <Button
          onClick={handleSubmit}
          disabled={createInscripcion.isPending}
          className="w-full bg-brand-brown hover:bg-brand-dark text-white min-h-[48px]"
        >
          {createInscripcion.isPending ? 'Inscribiendo...' : 'Confirmar inscripción'}
        </Button>
      )}
    </div>
  );
}
