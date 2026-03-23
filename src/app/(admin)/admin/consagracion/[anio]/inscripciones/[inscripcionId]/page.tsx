'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFormacionConsagracion, useInscripcionesConsagracion, useCreateInscripcionConsagracion, useUpdateInscripcionConsagracion } from '@/lib/queries/consagracion';
import { inscripcionConsagracionSchema, contactoConsagracionSchema, CONSAGRACION_FIELDS, type InscripcionConsagracionInput } from '@/lib/validations/consagracion';
import { CONTACTO_ESTADO, CONTACTO_ESTADO_LABEL, INSCRIPCION_ESTADO, type ContactoEstado } from '@/lib/constants/consagracion';
import { fieldError, toCapitalize } from '@/lib/utils/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/types/supabase';

type Inscripcion = Database['public']['Tables']['inscripciones_consagracion']['Row'];
type Modo = 'contactar' | 'inscripto';

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
  estado_contacto: ContactoEstado;
  observacion_contacto: string;
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
  estado_contacto: CONTACTO_ESTADO.PENDIENTE,
  observacion_contacto: '',
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
  estado_contacto:  ins.estado_contacto ?? CONTACTO_ESTADO.PENDIENTE,
  observacion_contacto: ins.observacion_contacto ?? '',
});

export default function ConsagracionInscripcionPage() {
  const { anio, inscripcionId } = useParams<{ anio: string; inscripcionId: string }>();
  const searchParams = useSearchParams();
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

  const [modo, setModo] = useState<Modo>('inscripto');
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [formReady, setFormReady] = useState(isNew);
  const [error, setError] = useState('');
  const modoParam = searchParams.get('modo');
  const modoForzado: Modo | null =
    modoParam === INSCRIPCION_ESTADO.CONTACTAR
      ? 'contactar'
      : modoParam === INSCRIPCION_ESTADO.INSCRIPTO
        ? 'inscripto'
        : null;

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setModo(modoForzado ?? 'inscripto');
      setFormReady(true);
      return;
    }
    if (target) {
      setForm(inscripcionToForm(target));
      setModo(modoForzado ?? (target.estado_inscripcion as Modo) ?? 'inscripto');
      setFormReady(true);
    }
  }, [isNew, modoForzado, target]);

  const set = (key: keyof FormValues, value: FormValues[keyof FormValues]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSacramento = (value: string) =>
    setForm((prev) => ({
      ...prev,
      sacramentos: prev.sacramentos.includes(value)
        ? prev.sacramentos.filter((s) => s !== value)
        : [...prev.sacramentos, value],
    }));

  const getValue = (key: keyof FormValues): string | undefined => {
    const value = form[key];
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (modo === 'contactar') {
        const parsed = contactoConsagracionSchema.safeParse({
          nombre:             toCapitalize(form.nombre),
          apellido:           toCapitalize(form.apellido),
          whatsapp:           form.whatsapp.trim(),
          estado_contacto:    form.estado_contacto,
          observacion_contacto: form.observacion_contacto.trim(),
          estado_inscripcion: INSCRIPCION_ESTADO.CONTACTAR,
        });
        if (!parsed.success) {
          setError(fieldError(parsed.error.issues[0].message));
          return;
        }
        if (isNew) {
          await crear(parsed.data);
        } else if (target) {
          await actualizar({ id: target.id, input: parsed.data });
        }
      } else {
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
          nombre:             toCapitalize(form.nombre),
          apellido:           toCapitalize(form.apellido),
          dni:                form.dni.trim(),
          domicilio:          form.domicilio.trim(),
          whatsapp:           form.whatsapp.trim(),
          estado_civil:       form.estado_civil as InscripcionConsagracionInput['estado_civil'],
          tipo_inscripcion:   form.tipo_inscripcion as InscripcionConsagracionInput['tipo_inscripcion'],
          sacramentos:        form.sacramentos,
          comentario:         form.comentario.trim(),
          estado_contacto:    form.estado_contacto,
          observacion_contacto: form.observacion_contacto.trim(),
          estado_inscripcion: INSCRIPCION_ESTADO.INSCRIPTO,
        };
        const parsed = inscripcionConsagracionSchema.safeParse(input);
        if (!parsed.success) {
          setError(fieldError(parsed.error.issues[0].message));
          return;
        }
        if (isNew) {
          await crear(parsed.data);
        } else if (target) {
          await actualizar({ id: target.id, input: parsed.data });
        }
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
  if (!isNew && !formReady) return <p className="text-brand-brown">Cargando...</p>;

  const isPending = creando || actualizando;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => router.push(`/admin/consagracion/${anio}/inscripciones`)} className="text-brand-brown -ml-3 w-fit">
          ← Volver
        </Button>
        <h1 className="font-title text-2xl text-brand-dark">
          {isNew ? 'Nueva inscripción' : 'Editar inscripción'}
        </h1>
      </div>

      {/* Selector de modo */}
      <div className="flex rounded-lg border border-brand-creamLight overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => { setModo('contactar'); setError(''); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            modo === 'contactar'
              ? 'bg-brand-brown text-white'
              : 'bg-white text-brand-brown hover:bg-brand-cream'
          }`}
        >
          Interesados
        </button>
        <button
          type="button"
          onClick={() => { setModo('inscripto'); setError(''); }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l border-brand-creamLight ${
            modo === 'inscripto'
              ? 'bg-brand-brown text-white'
              : 'bg-white text-brand-brown hover:bg-brand-cream'
          }`}
        >
          Inscripción completa
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-creamLight">
        <h2 className="font-title text-brand-brown mb-4">
          {modo === 'contactar' ? 'Datos de contacto' : 'Datos de la inscripción'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Campos siempre visibles */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                className="min-h-[48px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Apellido *</Label>
              <Input
                value={form.apellido}
                onChange={(e) => set('apellido', e.target.value)}
                className="min-h-[48px]"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>WhatsApp (sin +, solo números) *</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              className="min-h-[48px]"
            />
          </div>

          {modo === 'contactar' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Estado del contacto *</Label>
                <Select
                  value={form.estado_contacto}
                  onValueChange={(value) => set('estado_contacto', value as ContactoEstado)}
                >
                  <SelectTrigger className="min-h-[48px]">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONTACTO_ESTADO_LABEL) as ContactoEstado[]).map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {CONTACTO_ESTADO_LABEL[estado]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="observacion_contacto">Observacion / Notas</Label>
                <Textarea
                  id="observacion_contacto"
                  value={form.observacion_contacto}
                  onChange={(e) => set('observacion_contacto', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Campos solo para inscripción completa */}
          {modo === 'inscripto' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Estado del contacto</Label>
                <Select
                  value={form.estado_contacto}
                  onValueChange={(value) => set('estado_contacto', value as ContactoEstado)}
                >
                  <SelectTrigger className="min-h-[48px]">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONTACTO_ESTADO_LABEL) as ContactoEstado[]).map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {CONTACTO_ESTADO_LABEL[estado]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="observacion_contacto_inscripto">Observacion / Notas de contacto</Label>
                <Textarea
                  id="observacion_contacto_inscripto"
                  value={form.observacion_contacto}
                  onChange={(e) => set('observacion_contacto', e.target.value)}
                  rows={3}
                />
              </div>

              {CONSAGRACION_FIELDS.filter((f) => !['nombre', 'apellido', 'whatsapp'].includes(f.name)).map((fieldConfig) => {
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
            </>
          )}

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
    </div>
  );
}
