'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  inscripcionConsagracionSchema,
  CONSAGRACION_FIELDS,
  type InscripcionConsagracionInput,
} from '@/lib/validations/consagracion';
import { INSCRIPCION_ESTADO } from '@/lib/constants/consagracion';
import { fieldError } from '@/lib/utils/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InscripcionFormProps {
  formacionId: string;
  onSuccess?: () => void;
}

export const InscripcionForm = ({ formacionId, onSuccess }: InscripcionFormProps) => {
  const [pendingSubmit, setPendingSubmit] = useState<InscripcionConsagracionInput | null>(null);

  const form = useForm({
    defaultValues: {
      nombre:           '',
      apellido:         '',
      dni:              '',
      domicilio:        '',
      whatsapp:         '',
      estado_civil:     '' as InscripcionConsagracionInput['estado_civil'],
      tipo_inscripcion: '' as InscripcionConsagracionInput['tipo_inscripcion'],
      sacramentos:      [] as string[],
      comentario:       '',
    },
    validators: { onSubmit: inscripcionConsagracionSchema },
    onSubmit: ({ value }) => {
      // Guardar el value para confirmar antes de persistir
      setPendingSubmit({ ...value, estado_inscripcion: INSCRIPCION_ESTADO.INSCRIPTO });
    },
  });

  const confirmarEnvio = async () => {
    if (!pendingSubmit) return;

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    await supabase.from('inscripciones_consagracion').insert({
      ...pendingSubmit,
      formacion_id: formacionId,
    });

    setPendingSubmit(null);
    form.reset();
    onSuccess?.();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-5"
    >
      {/* Renderizado dinámico guiado por CONSAGRACION_FIELDS */}
      {CONSAGRACION_FIELDS.map((fieldConfig) => {
        const { name, label, type, required } = fieldConfig;

        if (type === 'select' && 'options' in fieldConfig) {
          return (
            <form.Field key={name} name={name}>
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label>{label}{required && ' *'}</Label>
                  <Select
                    value={String(field.state.value ?? '')}
                    onValueChange={(v) => field.handleChange(v as never)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldConfig.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>
          );
        }

        if (type === 'radio' && 'options' in fieldConfig) {
          return (
            <form.Field key={name} name={name}>
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>{label}{required && ' *'}</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {fieldConfig.options.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={name}
                          value={opt.value}
                          checked={field.state.value === opt.value}
                          onChange={() => field.handleChange(opt.value as never)}
                          className="accent-brand-brown w-4 h-4"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>
          );
        }

        if (type === 'checkboxGroup' && 'options' in fieldConfig) {
          return (
            <form.Field key={name} name="sacramentos">
              {(field) => {
                const valores = (field.state.value as string[]) ?? [];
                const toggle = (value: string) => {
                  const next = valores.includes(value)
                    ? valores.filter((v) => v !== value)
                    : [...valores, value];
                  field.handleChange(next);
                };

                return (
                  <div className="flex flex-col gap-2">
                    <Label>{label}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldConfig.options.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={valores.includes(opt.value)}
                            onCheckedChange={() => toggle(opt.value)}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }}
            </form.Field>
          );
        }

        if (type === 'textarea') {
          return (
            <form.Field key={name} name={name}>
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Textarea
                    id={name}
                    value={String(field.state.value ?? '')}
                    onChange={(e) => field.handleChange(e.target.value as never)}
                    onBlur={field.handleBlur}
                    rows={3}
                  />
                </div>
              )}
            </form.Field>
          );
        }

        // type: text | tel
        return (
          <form.Field key={name} name={name}>
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={name}>{label}{required && ' *'}</Label>
                <Input
                  id={name}
                  type={type === 'tel' ? 'tel' : 'text'}
                  inputMode={type === 'tel' ? 'numeric' : 'text'}
                  value={String(field.state.value ?? '')}
                  onChange={(e) => field.handleChange(e.target.value as never)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors[0] && (
                  <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
                )}
              </div>
            )}
          </form.Field>
        );
      })}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white font-title tracking-wide mt-2"
          >
            {isSubmitting ? 'Procesando...' : 'Inscribirme'}
          </Button>
        )}
      </form.Subscribe>

      {/* Dialog de confirmación antes de persistir */}
      <AlertDialog open={!!pendingSubmit} onOpenChange={(open) => !open && setPendingSubmit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar inscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSubmit && (
                <>
                  <strong>{pendingSubmit.apellido}, {pendingSubmit.nombre}</strong>
                  <br />
                  Una vez enviado no podrás modificar los datos. ¿Estás seguro/a?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar datos</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEnvio}
              className="bg-brand-brown hover:bg-brand-dark text-white"
            >
              Confirmar inscripción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};
