'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ContactosEmergenciaInput } from '@/components/retiros/ContactosEmergenciaInput';
import {
  useInscripcionesConversion,
  useCreateInscripcionConversion,
  useUpdateInscripcionConversion,
  useInscripcionesMatrimonios,
  useCreateInscripcionMatrimonios,
  useUpdateInscripcionMatrimonios,
  useInscripcionesMisioneros,
  useCreateInscripcionMisionero,
  useUpdateInscripcionMisionero,
  useMisioneros,
} from '@/lib/queries/retiros';
import { ESTADO_CIVIL_LABEL, ESTADO_RELACION_LABEL } from '@/lib/constants/retiros';
import type { InscripcionConversionInput, InscripcionMatrimoniosInput } from '@/lib/validations/retiros';
import type { Database } from '@/types/supabase';
import { toast } from 'sonner';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];
type EstadoRelacion = Database['public']['Enums']['estado_relacion'];

type ConversionRow = Database['public']['Tables']['inscripciones_retiro_conversion']['Row'];
type MatrimonioRow = Database['public']['Tables']['inscripciones_retiro_matrimonios']['Row'];
type MisioneroRow = Database['public']['Tables']['inscripciones_retiro_misioneros']['Row'];

const conversionDefaults: InscripcionConversionInput = {
  nombre: '',
  apellido: '',
  fecha_nacimiento: '',
  dni: '',
  estado_civil: '',
  domicilio: '',
  telefono: '',
  contactos_emergencia: [
    { nombre: '', whatsapp: '', relacion: '' },
    { nombre: '', whatsapp: '', relacion: '' },
    { nombre: '', whatsapp: '', relacion: '' },
  ],
  tiene_enfermedad: false,
  enfermedad_detalle: '',
  tiene_dieta_especial: false,
  dieta_especial_detalle: '',
  primer_retiro: true,
  bautizado: false,
};

const matrimoniosDefaults: InscripcionMatrimoniosInput & {
  entrevista_realizada?: boolean;
  entrevista_fecha?: string;
  entrevista_notas?: string;
  en_espera?: boolean;
} = {
  nombre_esposo: '',
  apellido_esposo: '',
  dni_esposo: '',
  fecha_nacimiento_esposo: '',
  whatsapp_esposo: '',
  nombre_esposa: '',
  apellido_esposa: '',
  dni_esposa: '',
  fecha_nacimiento_esposa: '',
  whatsapp_esposa: '',
  estado_relacion: 'casados',
  domicilio: '',
  como_se_enteraron: '',
  entrevista_realizada: false,
  entrevista_fecha: '',
  entrevista_notas: '',
  en_espera: false,
};

export default function RetiroInscripcionPage() {
  const { id, tipo, inscripcionId } = useParams<{ id: string; tipo: string; inscripcionId: string }>();
  const router = useRouter();

  const tipoRetiro = tipo as TipoRetiro;
  const isNew = inscripcionId === 'nuevo';

  const { data: conversion = [], isLoading: loadingConversion } = useInscripcionesConversion(id);
  const { data: matrimonios = [], isLoading: loadingMatrimonios } = useInscripcionesMatrimonios(id);
  const { data: misioneros = [], isLoading: loadingMisioneros } = useInscripcionesMisioneros(id);
  const { data: misionerosDisponibles = [] } = useMisioneros();

  const createConversion = useCreateInscripcionConversion(id);
  const updateConversion = useUpdateInscripcionConversion(id);
  const createMatrimonios = useCreateInscripcionMatrimonios(id);
  const updateMatrimonios = useUpdateInscripcionMatrimonios(id);
  const createMisionero = useCreateInscripcionMisionero(id);
  const updateMisionero = useUpdateInscripcionMisionero(id);

  const conversionTarget = useMemo(
    () => conversion.find((insc) => insc.id === inscripcionId),
    [conversion, inscripcionId]
  ) as ConversionRow | undefined;
  const matrimoniosTarget = useMemo(
    () => matrimonios.find((insc) => insc.id === inscripcionId),
    [matrimonios, inscripcionId]
  ) as MatrimonioRow | undefined;
  const misionerosTarget = useMemo(
    () => misioneros.find((insc) => insc.id === inscripcionId),
    [misioneros, inscripcionId]
  ) as MisioneroRow | undefined;

  const [conversionForm, setConversionForm] = useState<InscripcionConversionInput>(conversionDefaults);
  const [conversionEspera, setConversionEspera] = useState(false);
  const [matrimoniosForm, setMatrimoniosForm] = useState(matrimoniosDefaults);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');

  useEffect(() => {
    if (tipoRetiro !== 'conversion' || isNew || !conversionTarget) return;
    setConversionForm({
      nombre: conversionTarget.nombre,
      apellido: conversionTarget.apellido,
      fecha_nacimiento: conversionTarget.fecha_nacimiento ?? '',
      dni: conversionTarget.dni,
      estado_civil: conversionTarget.estado_civil ?? '',
      domicilio: conversionTarget.domicilio ?? '',
      telefono: conversionTarget.telefono,
      contactos_emergencia: (conversionTarget.contactos_emergencia as InscripcionConversionInput['contactos_emergencia']) ?? [
        { nombre: '', whatsapp: '', relacion: '' },
        { nombre: '', whatsapp: '', relacion: '' },
        { nombre: '', whatsapp: '', relacion: '' },
      ],
      tiene_enfermedad: conversionTarget.tiene_enfermedad ?? false,
      enfermedad_detalle: conversionTarget.enfermedad_detalle ?? '',
      tiene_dieta_especial: conversionTarget.tiene_dieta_especial ?? false,
      dieta_especial_detalle: conversionTarget.dieta_especial_detalle ?? '',
      primer_retiro: conversionTarget.primer_retiro ?? true,
      bautizado: conversionTarget.bautizado ?? false,
    });
    setConversionEspera(!!conversionTarget.en_espera);
  }, [tipoRetiro, isNew, conversionTarget]);

  useEffect(() => {
    if (tipoRetiro !== 'matrimonios' || isNew || !matrimoniosTarget) return;
    setMatrimoniosForm({
      nombre_esposo: matrimoniosTarget.nombre_esposo,
      apellido_esposo: matrimoniosTarget.apellido_esposo,
      dni_esposo: matrimoniosTarget.dni_esposo,
      fecha_nacimiento_esposo: matrimoniosTarget.fecha_nacimiento_esposo ?? '',
      whatsapp_esposo: matrimoniosTarget.whatsapp_esposo,
      nombre_esposa: matrimoniosTarget.nombre_esposa,
      apellido_esposa: matrimoniosTarget.apellido_esposa,
      dni_esposa: matrimoniosTarget.dni_esposa,
      fecha_nacimiento_esposa: matrimoniosTarget.fecha_nacimiento_esposa ?? '',
      whatsapp_esposa: matrimoniosTarget.whatsapp_esposa,
      estado_relacion: matrimoniosTarget.estado_relacion,
      domicilio: matrimoniosTarget.domicilio ?? '',
      como_se_enteraron: matrimoniosTarget.como_se_enteraron ?? '',
      entrevista_realizada: matrimoniosTarget.entrevista_realizada ?? false,
      entrevista_fecha: matrimoniosTarget.entrevista_fecha ?? '',
      entrevista_notas: matrimoniosTarget.entrevista_notas ?? '',
      en_espera: matrimoniosTarget.en_espera ?? false,
    });
  }, [tipoRetiro, isNew, matrimoniosTarget]);

  useEffect(() => {
    if (tipoRetiro !== 'misioneros' || isNew || !misionerosTarget) return;
    setMisioneroSeleccionado(misionerosTarget.misionero_id ?? '');
  }, [tipoRetiro, isNew, misionerosTarget]);

  const goBack = () => router.push(`/admin/retiros/${id}`);

  const saveConversion = async () => {
    try {
      if (isNew) {
        await createConversion.mutateAsync({ ...conversionForm, en_espera: conversionEspera });
        toast.success('Inscripción creada');
      } else if (conversionTarget) {
        await updateConversion.mutateAsync({
          id: conversionTarget.id,
          input: { ...conversionForm, en_espera: conversionEspera },
        });
        toast.success('Inscripción actualizada');
      }
      goBack();
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  const saveMatrimonios = async () => {
    try {
      if (isNew) {
        await createMatrimonios.mutateAsync({
          ...matrimoniosForm,
          estado_relacion: matrimoniosForm.estado_relacion as EstadoRelacion,
        });
        toast.success('Inscripción creada');
      } else if (matrimoniosTarget) {
        await updateMatrimonios.mutateAsync({
          id: matrimoniosTarget.id,
          input: {
            ...matrimoniosForm,
            estado_relacion: matrimoniosForm.estado_relacion as EstadoRelacion,
          },
        });
        toast.success('Inscripción actualizada');
      }
      goBack();
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  const saveMisionero = async () => {
    if (!misioneroSeleccionado) return;
    try {
      if (isNew) {
        await createMisionero.mutateAsync(misioneroSeleccionado);
        toast.success('Inscripción creada');
      } else if (misionerosTarget) {
        await updateMisionero.mutateAsync({ id: misionerosTarget.id, misioneroId: misioneroSeleccionado });
        toast.success('Inscripción actualizada');
      }
      goBack();
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  if (!['conversion', 'matrimonios', 'misioneros'].includes(tipoRetiro)) {
    return <p className="text-red-600">Tipo de inscripción inválido</p>;
  }

  if (!isNew && ((tipoRetiro === 'conversion' && loadingConversion) || (tipoRetiro === 'matrimonios' && loadingMatrimonios) || (tipoRetiro === 'misioneros' && loadingMisioneros))) {
    return <p className="text-brand-brown">Cargando...</p>;
  }

  if (!isNew && ((tipoRetiro === 'conversion' && !conversionTarget) || (tipoRetiro === 'matrimonios' && !matrimoniosTarget) || (tipoRetiro === 'misioneros' && !misionerosTarget))) {
    return <p className="text-red-600">Inscripción no encontrada</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={goBack} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-2xl text-brand-dark">
            {isNew ? 'Nueva inscripción' : 'Editar inscripción'}
          </h1>
        </div>
      </div>

      {tipoRetiro === 'conversion' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nombre" value={conversionForm.nombre} onChange={(e) => setConversionForm((p) => ({ ...p, nombre: e.target.value }))} />
            <Input placeholder="Apellido" value={conversionForm.apellido} onChange={(e) => setConversionForm((p) => ({ ...p, apellido: e.target.value }))} />
            <Input placeholder="DNI" value={conversionForm.dni} onChange={(e) => setConversionForm((p) => ({ ...p, dni: e.target.value }))} />
            <Input placeholder="Teléfono" value={conversionForm.telefono} onChange={(e) => setConversionForm((p) => ({ ...p, telefono: e.target.value }))} />
            <Input type="date" value={conversionForm.fecha_nacimiento} onChange={(e) => setConversionForm((p) => ({ ...p, fecha_nacimiento: e.target.value }))} />
            <Input placeholder="Domicilio" value={conversionForm.domicilio} onChange={(e) => setConversionForm((p) => ({ ...p, domicilio: e.target.value }))} />
          </div>
          <Select value={conversionForm.estado_civil} onValueChange={(v) => setConversionForm((p) => ({ ...p, estado_civil: v }))}>
            <SelectTrigger><SelectValue placeholder="Estado civil" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_CIVIL_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ContactosEmergenciaInput
            value={conversionForm.contactos_emergencia}
            onChange={(v) => setConversionForm((p) => ({ ...p, contactos_emergencia: v }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={conversionForm.tiene_enfermedad} onCheckedChange={(c) => setConversionForm((p) => ({ ...p, tiene_enfermedad: !!c }))} />
              Tiene enfermedad
            </label>
            <Input placeholder="Detalle enfermedad" value={conversionForm.enfermedad_detalle} onChange={(e) => setConversionForm((p) => ({ ...p, enfermedad_detalle: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={conversionForm.tiene_dieta_especial} onCheckedChange={(c) => setConversionForm((p) => ({ ...p, tiene_dieta_especial: !!c }))} />
              Dieta especial
            </label>
            <Input placeholder="Detalle dieta" value={conversionForm.dieta_especial_detalle} onChange={(e) => setConversionForm((p) => ({ ...p, dieta_especial_detalle: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={conversionForm.primer_retiro} onCheckedChange={(c) => setConversionForm((p) => ({ ...p, primer_retiro: !!c }))} />
              Primer retiro
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={conversionForm.bautizado} onCheckedChange={(c) => setConversionForm((p) => ({ ...p, bautizado: !!c }))} />
              Bautizado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={conversionEspera} onCheckedChange={(c) => setConversionEspera(!!c)} />
              En espera
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={goBack}>Cancelar</Button>
            <Button onClick={saveConversion}>Guardar</Button>
          </div>
        </div>
      )}

      {tipoRetiro === 'matrimonios' && (
        <div className="flex flex-col gap-4">
          <div className="bg-brand-cream/50 p-4 rounded-lg">
            <h3 className="font-medium text-brand-dark mb-4">Datos del Esposo</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={matrimoniosForm.nombre_esposo}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, nombre_esposo: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido *</Label>
                  <Input
                    value={matrimoniosForm.apellido_esposo}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, apellido_esposo: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>DNI *</Label>
                  <Input
                    value={matrimoniosForm.dni_esposo}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, dni_esposo: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input
                    type="tel"
                    value={matrimoniosForm.whatsapp_esposo}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, whatsapp_esposo: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={matrimoniosForm.fecha_nacimiento_esposo}
                  onChange={(e) => setMatrimoniosForm((p) => ({ ...p, fecha_nacimiento_esposo: e.target.value }))}
                  className="min-h-[48px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-brand-cream/50 p-4 rounded-lg">
            <h3 className="font-medium text-brand-dark mb-4">Datos de la Esposa</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={matrimoniosForm.nombre_esposa}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, nombre_esposa: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido *</Label>
                  <Input
                    value={matrimoniosForm.apellido_esposa}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, apellido_esposa: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>DNI *</Label>
                  <Input
                    value={matrimoniosForm.dni_esposa}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, dni_esposa: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input
                    type="tel"
                    value={matrimoniosForm.whatsapp_esposa}
                    onChange={(e) => setMatrimoniosForm((p) => ({ ...p, whatsapp_esposa: e.target.value }))}
                    className="min-h-[48px]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={matrimoniosForm.fecha_nacimiento_esposa}
                  onChange={(e) => setMatrimoniosForm((p) => ({ ...p, fecha_nacimiento_esposa: e.target.value }))}
                  className="min-h-[48px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Estado de la relación *</Label>
              <Select value={matrimoniosForm.estado_relacion} onValueChange={(v) => setMatrimoniosForm((p) => ({ ...p, estado_relacion: v as EstadoRelacion }))}>
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue placeholder="Estado de relación" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_RELACION_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Domicilio</Label>
              <Input
                value={matrimoniosForm.domicilio}
                onChange={(e) => setMatrimoniosForm((p) => ({ ...p, domicilio: e.target.value }))}
                className="min-h-[48px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>¿Cómo se enteraron del retiro?</Label>
              <Input
                value={matrimoniosForm.como_se_enteraron}
                onChange={(e) => setMatrimoniosForm((p) => ({ ...p, como_se_enteraron: e.target.value }))}
                className="min-h-[48px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!matrimoniosForm.entrevista_realizada} onCheckedChange={(c) => setMatrimoniosForm((p) => ({ ...p, entrevista_realizada: !!c }))} />
              Entrevista realizada
            </label>
            <div className="space-y-1.5">
              <Label>Fecha de entrevista</Label>
              <Input
                type="date"
                value={matrimoniosForm.entrevista_fecha ?? ''}
                onChange={(e) => setMatrimoniosForm((p) => ({ ...p, entrevista_fecha: e.target.value }))}
                className="min-h-[48px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas entrevista</Label>
            <Textarea
              value={matrimoniosForm.entrevista_notas ?? ''}
              onChange={(e) => setMatrimoniosForm((p) => ({ ...p, entrevista_notas: e.target.value }))}
              className="min-h-[120px]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!matrimoniosForm.en_espera} onCheckedChange={(c) => setMatrimoniosForm((p) => ({ ...p, en_espera: !!c }))} />
            En espera
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={goBack}>Cancelar</Button>
            <Button onClick={saveMatrimonios}>Guardar</Button>
          </div>
        </div>
      )}

      {tipoRetiro === 'misioneros' && (
        <div className="flex flex-col gap-4">
          <Select value={misioneroSeleccionado} onValueChange={setMisioneroSeleccionado}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar misionero" />
            </SelectTrigger>
            <SelectContent>
              {misionerosDisponibles.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.apellido}, {m.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={goBack}>Cancelar</Button>
            <Button onClick={saveMisionero} disabled={!misioneroSeleccionado}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
