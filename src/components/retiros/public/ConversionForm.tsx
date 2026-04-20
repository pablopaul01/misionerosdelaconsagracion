'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useCreateInscripcionConversion } from '@/lib/queries/retiros';
import { inscripcionConversionSchema, defaultInscripcionConversion } from '@/lib/validations/retiros';
import type { ContactoEmergencia, InscripcionConversionInput } from '@/lib/validations/retiros';
import { ESTADO_CIVIL_LABEL, SACRAMENTOS_RETIRO_LABEL } from '@/lib/constants/retiros';
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
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ZodIssue } from 'zod';

interface ConversionFormProps {
  retiroId: string;
}

const FIELD_SECTION_MAP: Record<Exclude<keyof InscripcionConversionInput, 'en_espera'>, number> = {
  nombre: 1,
  apellido: 1,
  fecha_nacimiento: 1,
  dni: 1,
  estado_civil: 1,
  domicilio: 1,
  telefono: 1,
  contactos_emergencia: 2,
  tiene_enfermedad: 3,
  enfermedad_detalle: 3,
  tiene_dieta_especial: 3,
  dieta_especial_detalle: 3,
  primer_retiro: 4,
  sacramentos: 4,
};

const CONTACTO_FIELD_LABEL: Record<keyof ContactoEmergencia, string> = {
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  relacion: 'Relación',
};

const getIssuePathKey = (path: ReadonlyArray<PropertyKey>): string => {
  return path
    .filter((segment): segment is string | number => typeof segment === 'string' || typeof segment === 'number')
    .map(String)
    .join('.');
};

const buildIssueMap = (issues: ZodIssue[]): Record<string, string> => {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const pathKey = getIssuePathKey(issue.path);
    if (!pathKey || acc[pathKey]) return acc;
    acc[pathKey] = issue.message;
    return acc;
  }, {});
};

export function ConversionForm({ retiroId }: ConversionFormProps) {
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [enEspera, setEnEspera] = useState(false);
  const createInscripcion = useCreateInscripcionConversion(retiroId);

  const toggleSection = (section: number) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const form = useForm({
    defaultValues: defaultInscripcionConversion,
    validators: {
      onSubmit: inscripcionConversionSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createInscripcion.mutateAsync(value);
        setEnEspera(!!result?.en_espera);
        setSuccess(true);
      } catch {
        toast.error('Error al enviar inscripción');
      }
    },
  });

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h2 className="font-title text-2xl text-brand-dark">
          {enEspera ? 'Quedaste en lista de espera' : '¡Preinscripción exitosa!'}
        </h2>
        <p className="text-brand-brown">
          {enEspera
            ? 'Los cupos se cubrieron. Quedaste en lista de espera y, si se libera un lugar, te contactaremos para que puedas inscribirte.'
            : 'Te preinscribiste con éxito. Pronto un misionero se pondrá en contacto con vos.'}
        </p>
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
      return values.primer_retiro !== undefined;
    }
    return false;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitAttempted(true);

        const validationResult = inscripcionConversionSchema.safeParse(form.state.values);
        if (!validationResult.success) {
          const [firstIssue] = validationResult.error.issues;
          const firstInvalidField = firstIssue?.path[0];
          if (typeof firstInvalidField === 'string') {
            const errorSection = FIELD_SECTION_MAP[firstInvalidField as keyof typeof FIELD_SECTION_MAP];
            if (errorSection) {
              setOpenSection(errorSection);
            }
          }

          return;
        }

        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Subscribe selector={(s) => s.values}>
        {(values) => (
          (() => {
            const submitValidation = submitAttempted ? inscripcionConversionSchema.safeParse(values) : null;
            const submitIssues = submitValidation && !submitValidation.success ? submitValidation.error.issues : [];
            const submitIssueMap = buildIssueMap(submitIssues);
            const hasSubmitErrors = submitIssues.length > 0;
            const getSubmitFieldError = (field: keyof InscripcionConversionInput): string | undefined => submitIssueMap[field];

            const contactoItemErrors = Array.from({ length: 3 }, () => ({} as Partial<Record<keyof ContactoEmergencia, string>>));
            let firstNestedContactoError: string | undefined;

            submitIssues.forEach((issue) => {
              const [root, index, contactField] = issue.path;
              if (root !== 'contactos_emergencia' || typeof index !== 'number' || typeof contactField !== 'string') {
                return;
              }

              if (!(contactField in CONTACTO_FIELD_LABEL)) {
                return;
              }

              const fieldKey = contactField as keyof ContactoEmergencia;
              const targetItem = contactoItemErrors[index];
              if (!targetItem) {
                return;
              }

              if (!targetItem[fieldKey]) {
                targetItem[fieldKey] = issue.message;
              }

              if (!firstNestedContactoError) {
                firstNestedContactoError = `Contacto ${index + 1} - ${CONTACTO_FIELD_LABEL[fieldKey]}: ${issue.message}`;
              }
            });

            const contactosError = getSubmitFieldError('contactos_emergencia') ?? firstNestedContactoError;

            return (
              <>
            {submitAttempted && hasSubmitErrors && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Revisá los campos marcados en rojo para poder enviar la inscripción.
                </p>
              </div>
            )}

            <FormSection
              title="Datos personales"
              sectionNumber={1}
              totalSections={4}
              isOpen={openSection === 1}
              onToggle={() => toggleSection(1)}
              isComplete={isSectionComplete(1, values)}
            >
              <div className="grid gap-4">
                <form.Field name="nombre">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('nombre') : undefined;
                        return (
                          <>
                      <Label>Nombre *</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="apellido">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('apellido') : undefined;
                        return (
                          <>
                      <Label>Apellido *</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="fecha_nacimiento">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('fecha_nacimiento') : undefined;
                        return (
                          <>
                      <Label>Fecha de nacimiento</Label>
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="dni">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('dni') : undefined;
                        return (
                          <>
                      <Label>DNI *</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                        maxLength={8}
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="estado_civil">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('estado_civil') : undefined;
                        return (
                          <>
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
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="domicilio">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('domicilio') : undefined;
                        return (
                          <>
                      <Label>Domicilio</Label>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>

                <form.Field name="telefono">
                  {(field) => (
                    <div className="space-y-1.5">
                      {(() => {
                        const errorMessage = submitAttempted ? getSubmitFieldError('telefono') : undefined;
                        return (
                          <>
                      <Label>Teléfono *</Label>
                      <Input
                        type="tel"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="min-h-[48px]"
                      />
                      {errorMessage && (
                        <span className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errorMessage}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </form.Field>
              </div>
            </FormSection>

            <FormSection
              title="Contactos de familiares/amigos"
              sectionNumber={2}
              totalSections={4}
              isOpen={openSection === 2}
              onToggle={() => toggleSection(2)}
              isComplete={isSectionComplete(2, values)}
            >
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Estos contactos deben ser familiares o amigos que no participen del retiro.
                </p>
              </div>
              <form.Field name="contactos_emergencia">
                {(field) => (
                  <ContactosEmergenciaInput
                    value={field.state.value}
                    onChange={field.handleChange}
                    error={submitAttempted ? contactosError : undefined}
                    itemErrors={contactoItemErrors}
                    showErrors={submitAttempted}
                  />
                )}
              </form.Field>
            </FormSection>

            <FormSection
              title="Información de salud"
              sectionNumber={3}
              totalSections={4}
              isOpen={openSection === 3}
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
                        {(() => {
                          const errorMessage = submitAttempted ? getSubmitFieldError('enfermedad_detalle') : undefined;
                          return (
                            <>
                        <Label>Especificar</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="min-h-[48px]"
                        />
                        {errorMessage && (
                          <span className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errorMessage}
                          </span>
                        )}
                            </>
                          );
                        })()}
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
                        {(() => {
                          const errorMessage = submitAttempted ? getSubmitFieldError('dieta_especial_detalle') : undefined;
                          return (
                            <>
                        <Label>Especificar</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="min-h-[48px]"
                        />
                        {errorMessage && (
                          <span className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errorMessage}
                          </span>
                        )}
                            </>
                          );
                        })()}
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
              isOpen={openSection === 4}
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

                <form.Field name="sacramentos">
                  {(field) => {
                    const selectedSacramentos = field.state.value;

                    const toggleSacramento = (sacramento: (typeof selectedSacramentos)[number]) => {
                      const next = selectedSacramentos.includes(sacramento)
                        ? selectedSacramentos.filter((value) => value !== sacramento)
                        : [...selectedSacramentos, sacramento];
                      field.handleChange(next);
                    };

                    return (
                      <div className="space-y-2">
                        <Label>Marque los sacramentos recibidos</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(SACRAMENTOS_RETIRO_LABEL).map(([value, label]) => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={selectedSacramentos.includes(value as (typeof selectedSacramentos)[number])}
                                onCheckedChange={() => toggleSacramento(value as (typeof selectedSacramentos)[number])}
                              />
                              <span className="text-sm text-brand-dark">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                </form.Field>
              </div>
            </FormSection>
              </>
            );
          })()
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
