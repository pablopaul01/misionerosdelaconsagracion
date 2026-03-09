'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useCreateInscripcionMatrimonios } from '@/lib/queries/retiros';
import { inscripcionMatrimoniosSchema, defaultInscripcionMatrimonios } from '@/lib/validations/retiros';
import { ESTADO_RELACION_LABEL } from '@/lib/constants/retiros';
import type { EstadoRelacion } from '@/lib/constants/retiros';
import { fieldError } from '@/lib/utils/form';
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
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface MatrimoniosFormProps {
  retiroId: string;
}

export function MatrimoniosForm({ retiroId }: MatrimoniosFormProps) {
  const createInscripcion = useCreateInscripcionMatrimonios(retiroId);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: defaultInscripcionMatrimonios,
    validators: { onChange: inscripcionMatrimoniosSchema },
    onSubmit: async ({ value }) => {
      try {
        await createInscripcion.mutateAsync(value);
        setSuccess(true);
      } catch {
        toast.error('Error al enviar pre-inscripción');
      }
    },
  });

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-title text-2xl text-brand-dark">¡Pre-inscripción enviada!</h2>
        <p className="text-brand-brown">Nos pondremos en contacto para coordinar la entrevista.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <div className="bg-brand-cream/50 p-4 rounded-lg">
        <h3 className="font-medium text-brand-dark mb-4">Datos del Esposo</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="nombre_esposo">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="apellido_esposo">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>Apellido *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="dni_esposo">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>DNI *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                    maxLength={8}
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="whatsapp_esposo">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="fecha_nacimiento_esposo">
            {(field) => (
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="min-h-[48px]"
                />
                {field.state.meta.errors[0] && (
                  <span className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldError(field.state.meta.errors[0])}
                  </span>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div className="bg-brand-cream/50 p-4 rounded-lg">
        <h3 className="font-medium text-brand-dark mb-4">Datos de la Esposa</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="nombre_esposa">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="apellido_esposa">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>Apellido *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="dni_esposa">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>DNI *</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                    maxLength={8}
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
            <form.Field name="whatsapp_esposa">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-[48px]"
                  />
                  {field.state.meta.errors[0] && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldError(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="fecha_nacimiento_esposa">
            {(field) => (
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="min-h-[48px]"
                />
                {field.state.meta.errors[0] && (
                  <span className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldError(field.state.meta.errors[0])}
                  </span>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div className="space-y-4">
        <form.Field name="estado_relacion">
          {(field) => (
            <div className="space-y-1.5">
              <Label>Estado de la relación *</Label>
              <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as EstadoRelacion)}>
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_RELACION_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors[0] && (
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldError(field.state.meta.errors[0])}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="domicilio">
          {(field) => (
            <div className="space-y-1.5">
              <Label>Domicilio</Label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="min-h-[48px]"
              />
              {field.state.meta.errors[0] && (
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldError(field.state.meta.errors[0])}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="como_se_enteraron">
          {(field) => (
            <div className="space-y-1.5">
              <Label>¿Cómo se enteraron del retiro?</Label>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="min-h-[48px]"
              />
              {field.state.meta.errors[0] && (
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldError(field.state.meta.errors[0])}
                </span>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-brown hover:bg-brand-dark text-white min-h-[48px]"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar pre-inscripción'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
