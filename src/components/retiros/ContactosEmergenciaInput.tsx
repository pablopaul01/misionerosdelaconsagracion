'use client';

import { useEffect } from 'react';
import { User, Phone, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContactoEmergencia } from '@/lib/validations/retiros';
import { cn } from '@/lib/utils';

interface ContactosEmergenciaInputProps {
  value: ContactoEmergencia[];
  onChange: (contactos: ContactoEmergencia[]) => void;
  error?: string;
  itemErrors?: Array<Partial<Record<keyof ContactoEmergencia, string>>>;
  showErrors?: boolean;
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
  itemErrors = [],
  showErrors = false,
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
      <Label className="text-sm font-medium text-brand-dark">
        Contactos familiares / amigos (3 obligatorios)
      </Label>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => {
          const contacto = value[index] || EMPTY_CONTACTO;
          const currentItemErrors = itemErrors[index];
          const nombreError = currentItemErrors?.nombre ?? (showErrors && !contacto.nombre ? 'Nombre requerido' : undefined);
          const whatsappError = currentItemErrors?.whatsapp
            ?? (showErrors && !/^\d{10}$/.test(contacto.whatsapp)
              ? (contacto.whatsapp ? 'Formato inválido. Ej: 3814038899' : 'WhatsApp requerido')
              : undefined);
          const relacionError = currentItemErrors?.relacion ?? (showErrors && !contacto.relacion ? 'Relación requerida' : undefined);
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
                  className={cn('min-h-[48px]', nombreError && 'border-red-500 focus-visible:ring-red-500')}
                />
                {nombreError && <p className="text-xs text-red-500">{nombreError}</p>}
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
                  className={cn('min-h-[48px]', whatsappError && 'border-red-500 focus-visible:ring-red-500')}
                />
                {whatsappError && <p className="text-xs text-red-500">{whatsappError}</p>}
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
                  className={cn('min-h-[48px]', relacionError && 'border-red-500 focus-visible:ring-red-500')}
                />
                {relacionError && <p className="text-xs text-red-500">{relacionError}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
