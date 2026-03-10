'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormacionConsagracion, useInscripcionesConsagracion, useCreateInscripcionConsagracion, useUpdateInscripcionConsagracion } from '@/lib/queries/consagracion';
import { inscripcionConsagracionSchema, CONSAGRACION_FIELDS, type InscripcionConsagracionInput } from '@/lib/validations/consagracion';
import { fieldError } from '@/lib/utils/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/types/supabase';

type Inscripcion = Database['public']['Tables']['inscripciones_consagracion']['Row'];

type FormValues = {
  nombre: string;
  apellido: string;
  dni: string;
  domicilio: string;
  whatsapp: string;
  estado_civil: string;
  tipo_inscripcion: string;
  sacramentos: string[];
  comentario: string;
};

const EMPTY_FORM: FormValues = {
  nombre: '',
  apellido: '',
  dni: '',
  domicilio: '',
  whatsapp: '',
  estado_civil: '',
  tipo_inscripcion: '',
  sacramentos: [],
  comentario: '',
};

const inscripcionToForm = (ins: Inscripcion): FormValues => ({
  nombre:           ins.nombre,
  apellido:         ins.apellido,
  dni:              ins.dni ?? '',
  domicilio:        ins.domicilio ?? '',
  whatsapp:         ins.whatsapp ?? '',
  estado_civil:     ins.estado_civil ?? '',
  tipo_inscripcion: ins.tipo_inscripcion ?? '',
  sacramentos:      (ins.sacramentos as string[]) ?? [],
  comentario:       ins.comentario ?? '',
});

export default function ConsagracionInscripcionPage() {
  const { anio, inscripcionId } = useParams<{ anio: string; inscripcionId: string }>();
  const router = useRouter();
  const anioNum = Number(anio);
  const isNew = inscripcionId === 'nuevo';

  const { data: formacion, isLoading: loadingFormacion } = useFormacionConsagracion(anioNum);
  const formacionId = formacion?.id ?? '';

  const { data: inscripciones = [], isLoading: loadingInscripciones } = useInscripcionesConsagracion(formacionId);
  const { mutateAsync: crear, isPending: creando } = useCreateInscripcionConsagracion(formacionId);
  const { mutateAsync: actualizar, isPending: actualizando } = useUpdateInscripcionConsagracion(formacionId);

  const target = useMemo(
    () => (inscripciones as Inscripcion[]).find((ins) => ins.id === inscripcionId),
    [inscripciones, inscripcionId]
  );

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      return;
    }
    if (target) {
      setForm(inscripcionToForm(target));
    }
  }, [isNew, target]);

  const set = (key: keyof FormValues, value: FormValues[keyof FormValues]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSacramento = (value: string) =>
    setForm((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(value)
        ? prev.sacramentos.filter((s) => s !== value)
        : [...prev.sacramentos, value],
    }));

  const getValue = (key: keyof FormValues) => {
    const value = form[key];
    return typeof value === 'string' ? value : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const requiredFields = CONSAGRACION_FIELDS.filter((f) => f.required).map((f) => f.name);
    const missing = requiredFields.filter((name) => {
      const value = form[name as keyof FormValues];
      if (Array.isArray(value)) return value.length === 0;
      return !String(value).trim();
    });
    if (missing.length > 0) {
      setError('Completá los campos obligatorios (*)');
      return;
    }

    const input: InscripcionConsagracionInput = {
      nombre:           form.nombre.trim(),
      apellido:         form.apellido.trim(),
      dni:              form.dni.trim(),
      domicilio:        form.domicilio.trim(),
      whatsapp:         form.whatsapp.trim(),
      estado_civil:     form.estado_civil as InscripcionConsagracionInput['estado_civil'],
      tipo_inscripcion: form.tipo_inscripcion as InscripcionConsagracionInput['tipo_inscripcion'],
      sacramentos:      form.sacramentos,
      comentario:       form.comentario.trim(),
    };

    const parsed = inscripcionConsagracionSchema.safeParse(input);
    if (!parsed.success) {
      setError(fieldError(parsed.error.issues[0].message));
      return;
    }

    try {
      if (isNew) {
        await crear(input);
      } else if (target) {
        await actualizar({ id: target.id, input });
      }
      router.push(`/admin/consagracion/${anio}/inscripciones`);
    } catch (e) {
      setError((e as Error)?.message ?? 'Error al guardar');
    }
  };

  if (loadingFormacion) return <p className="text-brand-brown">Cargando...</p>;
  if (!formacion) return <p className="text-red-600">Formación no encontrada</p>;
  if (!isNew && loadingInscripciones) return <p className="text-brand-brown">Cargando inscripción...</p>;
  if (!isNew && !target) return <p className="text-red-600">Inscripción no encontrada</p>;

  const isPending = creando || actualizando;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push(`/admin/consagracion/${anio}/inscripciones`)} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-2xl text-brand-dark">
            {isNew ? 'Nueva inscripción' : 'Editar inscripción'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {CONSAGRACION_FIELDS.map((fieldConfig) => {
          const { name, label, type, required } = fieldConfig;

          if (type === 'select' && 'options' in fieldConfig) {
            return (
              <div key={name} className="flex flex-col gap-1.5">
                <Label>{label}{required && ' *'}</Label>
                <Select
                  value={getValue(name as keyof FormValues)}
                  onValueChange={(v) => set(name as keyof FormValues, v)}
                >
                  <SelectTrigger className="min-h-[48px]">
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
              </div>
            );
          }

          if (type === 'radio' && 'options' in fieldConfig) {
            return (
              <div key={name} className="flex flex-col gap-2">
                <Label>{label}{required && ' *'}</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {fieldConfig.options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={name}
                        value={opt.value}
                        checked={getValue(name as keyof FormValues) === opt.value}
                        onChange={() => set(name as keyof FormValues, opt.value)}
                        className="accent-brand-brown w-4 h-4"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }

          if (type === 'checkboxGroup' && 'options' in fieldConfig) {
            return (
              <div key={name} className="flex flex-col gap-2">
                <Label>{label}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {fieldConfig.options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.sacramentos.includes(opt.value)}
                        onCheckedChange={() => toggleSacramento(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }

          if (type === 'textarea') {
            return (
              <div key={name} className="flex flex-col gap-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Textarea
                  id={name}
                  value={getValue(name as keyof FormValues)}
                  onChange={(e) => set(name as keyof FormValues, e.target.value)}
                  rows={3}
                />
              </div>
            );
          }

          return (
            <div key={name} className="flex flex-col gap-1.5">
              <Label>{label}{required && ' *'}</Label>
              <Input
                value={getValue(name as keyof FormValues)}
                onChange={(e) => set(name as keyof FormValues, e.target.value)}
                className="min-h-[48px]"
              />
            </div>
          );
        })}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push(`/admin/consagracion/${anio}/inscripciones`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="bg-brand-brown hover:bg-brand-dark text-white">
            {isPending ? 'Guardando...' : isNew ? 'Crear' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
