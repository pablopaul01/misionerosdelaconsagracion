'use client';

import { useEffect } from 'react';
import { User, Phone, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContactoEmergencia } from '@/lib/validations/retiros';

interface ContactosEmergenciaInputProps {
  value: ContactoEmergencia[];
  onChange: (contactos: ContactoEmergencia[]) => void;
  error?: string;
}

const EMPTY_CONTACTO: ContactoEmergencia = {
  nombre: '',
  whatsapp: '',
  relacion: '',
};

export function ContactosEmergenciaInput({
  value,
  onChange,
  error,
}: ContactosEmergenciaInputProps) {
  useEffect(() => {
    if (value.length === 0) {
      const tresContactos = Array.from({ length: 3 }, () => ({ ...EMPTY_CONTACTO }));
      onChange(tresContactos);
    }
  }, [value.length, onChange]);

  const updateContacto = (index: number, field: keyof ContactoEmergencia, fieldValue: string) => {
    const updated = value.map((c, i) =>
      i === index ? { ...c, [field]: fieldValue } : c
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Importante:</strong> Necesitamos 3 contactos (familiares o amigos) para enviarles una carta solicitando que oren por vos durante el retiro.
          Los participantes no lo saben.
        </p>
      </div>

      <Label className="text-sm font-medium text-brand-dark">
        Contactos familiares / amigos (3 obligatorios)
      </Label>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => {
          const contacto = value[index] || EMPTY_CONTACTO;
          return (
            <div
              key={index}
              className="p-4 border border-brand-brown/20 rounded-lg space-y-3 bg-brand-cream/30"
            >
              <span className="text-sm font-medium text-brand-brown">
                Contacto {index + 1}
              </span>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2 text-brand-dark/70">
                  <User className="w-4 h-4" />
                  Nombre completo
                </Label>
                <Input
                  value={contacto.nombre}
                  onChange={(e) => updateContacto(index, 'nombre', e.target.value)}
                  placeholder="Nombre del contacto"
                  className="min-h-[48px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2 text-brand-dark/70">
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={contacto.whatsapp}
                  onChange={(e) => updateContacto(index, 'whatsapp', e.target.value.replace(/\D/g, ''))}
                  placeholder="Solo números"
                  className="min-h-[48px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2 text-brand-dark/70">
                  <Heart className="w-4 h-4" />
                  Relación
                </Label>
                <Input
                  value={contacto.relacion}
                  onChange={(e) => updateContacto(index, 'relacion', e.target.value)}
                  placeholder="Ej: Mamá, Papá, Hermano, Amigo..."
                  className="min-h-[48px]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
