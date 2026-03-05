'use client';

import { useForm } from '@tanstack/react-form';
import { formacionSchema, type FormacionInput } from '@/lib/validations/formaciones';
import { fieldError } from '@/lib/utils/form';
import { TIPO_FORMACION, TIPO_FORMACION_LABEL, DIAS_SEMANA } from '@/lib/constants/formaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormacionFormProps {
  onSubmit: (value: FormacionInput) => Promise<void>;
}

export const FormacionForm = ({ onSubmit }: FormacionFormProps) => {
  const anioActual = new Date().getFullYear();

  const form = useForm({
    defaultValues: {
      tipo:         TIPO_FORMACION.SAN_LORENZO as FormacionInput['tipo'],
      anio:         anioActual,
      fecha_inicio: '',
      dia_semana:   1, // lunes por defecto
    },
    validators: { onSubmit: formacionSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {/* Tipo de formación */}
      <form.Field name="tipo">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de formación</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as FormacionInput['tipo'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TIPO_FORMACION).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_FORMACION_LABEL[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* Año */}
      <form.Field name="anio">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="anio">Año</Label>
            <Input
              id="anio"
              type="number"
              min={2020}
              max={2100}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      {/* Fecha de inicio */}
      <form.Field name="fecha_inicio">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input
              id="fecha_inicio"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>

      {/* Día de clase habitual */}
      <form.Field name="dia_semana">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Día de clase habitual</Label>
            <Select
              value={String(field.state.value)}
              onValueChange={(v) => field.handleChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS_SEMANA.map((dia, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {dia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white mt-2"
          >
            {isSubmitting ? 'Creando...' : 'Crear formación'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};
