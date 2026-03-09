'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCreateInscripcionConversion } from '@/lib/queries/retiros';
import { inscripcionConversionSchema, defaultInscripcionConversion } from '@/lib/validations/retiros';
import { ESTADO_CIVIL_LABEL } from '@/lib/constants/retiros';
import { fieldError } from '@/lib/utils/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormSection } from '@/components/retiros/FormSection';
import { ContactosEmergenciaInput } from '@/components/retiros/ContactosEmergenciaInput';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface ConversionFormProps {
  retiroId: string;
}

export function ConversionForm({ retiroId }: ConversionFormProps) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<number[]>([1]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [success, setSuccess] = useState(false);
  const createInscripcion = useCreateInscripcionConversion(retiroId);

  const toggleSection = (section: number) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const form = useForm({
    defaultValues: defaultInscripcionConversion,
    validators: { onChange: inscripcionConversionSchema },
    onSubmit: async ({ value }) => {
      try {
        await createInscripcion.mutateAsync(value);
        setSuccess(true);
      } catch {
        toast.error('Error al enviar inscripción');
      }
    },
  });

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-title text-2xl text-brand-dark">¡Inscripción enviada!</h2>
        <p className="text-brand-brown">Nos pondremos en contacto con vos pronto.</p>
      </div>
    )
  }

  const isSectionComplete = (section: number, values: typeof defaultInscripcionConversion) => {
    if (section === 1) {
      return !!(values.nombre && values.apellido && values.dni && values.telefono);
    }
    if (section === 2) {
      return values.contactos_emergencia.length > 0 && !!values.contactos_emergencia[0].nombre;
    }
    if (section === 3) {
      return values.tiene_enfermedad !== undefined && values.tiene_dieta_especial !== undefined;
    }
    if (section === 4) {
      return values.primer_retiro !== undefined && values.bautizado !== undefined;
    }
    return false;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setOpenSections([1, 2, 3, 4]);
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Subscribe selector={(s) => s.values}>
        {(values) => (
          <>
            <FormSection
              title="Datos personales"
              sectionNumber={1}
              totalSections={4}
              isOpen={openSections.includes(1)}
              onToggle={() => toggleSection(1)}
              isComplete={isSectionComplete(1, values)}
            >
              <div className="grid gap-4">
                <form.Field name="nombre">
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

                <form.Field name="apellido">
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

                <form.Field name="fecha_nacimiento">
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

                <form.Field name="dni">
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

                <form.Field name="estado_civil">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Estado civil</Label>
                      <Select value={field.state.value} onValueChange={field.handleChange}>
                        <SelectTrigger className="min-h-[48px]">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ESTADO_CIVIL_LABEL).map(([value, label]) => (
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

                <form.Field name="telefono">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label>Teléfono *</Label>
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
            </FormSection>

            <FormSection
              title="Contactos de familiares/amigos"
              sectionNumber={2}
              totalSections={4}
              isOpen={openSections.includes(2)}
              onToggle={() => toggleSection(2)}
              isComplete={isSectionComplete(2, values)}
            >
              <form.Field name="contactos_emergencia">
                {(field) => (
                  <ContactosEmergenciaInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    error={field.state.meta.errors[0] ? fieldError(field.state.meta.errors[0]) : undefined}
                    showErrors={submitAttempted}
                  />
                )}
              </form.Field>
            </FormSection>

            <FormSection
              title="Información de salud"
              sectionNumber={3}
              totalSections={4}
              isOpen={openSections.includes(3)}
              onToggle={() => toggleSection(3)}
              isComplete={isSectionComplete(3, values)}
            >
              <div className="space-y-4">
                <form.Field name="tiene_enfermedad">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                        id="tiene_enfermedad"
                      />
                      <Label htmlFor="tiene_enfermedad" className="cursor-pointer">
                        ¿Padece alguna enfermedad o alergia?
                      </Label>
                    </div>
                  )}
                </form.Field>

                {values.tiene_enfermedad && (
                  <form.Field name="enfermedad_detalle">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Especificar</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="min-h-[48px]"
                        />
                      </div>
                    )}
                  </form.Field>
                )}

                <form.Field name="tiene_dieta_especial">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                        id="tiene_dieta_especial"
                      />
                      <Label htmlFor="tiene_dieta_especial" className="cursor-pointer">
                        ¿Realiza alguna dieta especial por prescripción médica?
                      </Label>
                    </div>
                  )}
                </form.Field>

                {values.tiene_dieta_especial && (
                  <form.Field name="dieta_especial_detalle">
                    {(field) => (
                      <div className="space-y-1.5">
                        <Label>Especificar</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="min-h-[48px]"
                        />
                      </div>
                    )}
                  </form.Field>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Información del retiro"
              sectionNumber={4}
              totalSections={4}
              isOpen={openSections.includes(4)}
              onToggle={() => toggleSection(4)}
              isComplete={isSectionComplete(4, values)}
            >
              <div className="space-y-4">
                <form.Field name="primer_retiro">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                        id="primer_retiro"
                      />
                      <Label htmlFor="primer_retiro" className="cursor-pointer">
                        ¿Es su primer retiro espiritual?
                      </Label>
                    </div>
                  )}
                </form.Field>

                <form.Field name="bautizado">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                        id="bautizado"
                      />
                      <Label htmlFor="bautizado" className="cursor-pointer">
                        ¿Ha recibido el sacramento del Bautismo?
                      </Label>
                    </div>
                  )}
                </form.Field>
              </div>
            </FormSection>
          </>
        )}
      </form.Subscribe>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-brown hover:bg-brand-dark text-white min-h-[48px]"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar inscripción'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
