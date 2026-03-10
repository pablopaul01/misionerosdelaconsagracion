'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useInscripcionesConversion,
  useInscripcionesMatrimonios,
  useInscripcionesMisioneros,
  useDeleteInscripcionConversion,
  useDeleteInscripcionMatrimonios,
  useDeleteInscripcionMisionero,
  useCambiarEstadoEsperaConversion,
  useCambiarEstadoEsperaMatrimonios,
  useEstadisticasRetiro,
  usePagosByInscripcion,
  useCreatePago,
  useDeletePago,
  useCreateInscripcionConversion,
  useUpdateInscripcionConversion,
  useCreateInscripcionMatrimonios,
  useUpdateInscripcionMatrimonios,
  useCreateInscripcionMisionero,
  useUpdateInscripcionMisionero,
  useMisioneros,
} from '@/lib/queries/retiros';
import { METODO_PAGO_LABEL, ESTADO_CIVIL_LABEL, ESTADO_RELACION_LABEL } from '@/lib/constants/retiros';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Users, UserCheck, DollarSign, Plus, Pencil, MoreVertical } from 'lucide-react';
import type { Database } from '@/types/supabase';
import type { PagoInput } from '@/lib/validations/retiros';
import type { InscripcionConversionInput, InscripcionMatrimoniosInput } from '@/lib/validations/retiros';
import type { EstadoRelacion } from '@/lib/constants/retiros';
import { ContactosEmergenciaInput } from '@/components/retiros/ContactosEmergenciaInput';
import { Checkbox } from '@/components/ui/checkbox';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];
type MetodoPago = Database['public']['Enums']['metodo_pago'];
type ConversionRow = Database['public']['Tables']['inscripciones_retiro_conversion']['Row'];
type MatrimonioRow = Database['public']['Tables']['inscripciones_retiro_matrimonios']['Row'];
type MisioneroInscripcion = Database['public']['Tables']['inscripciones_retiro_misioneros']['Row'] & {
  misioneros?: Database['public']['Tables']['misioneros']['Row'] | null;
};

interface InscripcionesTabProps {
  retiroId: string;
  tipo: TipoRetiro;
}

type CreatePagoArgs = {
  tipoInscripcion: TipoRetiro;
  inscripcionId: string;
  input: PagoInput;
};

type DeletePagoArgs = {
  id: string;
  tipoInscripcion: TipoRetiro;
  inscripcionId: string;
};

type ActionItem = {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
};

const ActionMenu = ({ items }: { items: ActionItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded-full hover:bg-brand-creamLight text-brand-brown"
        aria-label="Acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-brand-creamLight rounded-lg shadow-lg z-50">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-creamLight ${item.tone === 'danger' ? 'text-red-500' : 'text-brand-brown'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export function InscripcionesTab({ retiroId, tipo }: InscripcionesTabProps) {
  const { data: stats } = useEstadisticasRetiro(retiroId, tipo);
  const { data: misionerosDisponibles = [] } = useMisioneros();

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'conversion'; id: string; label: string }
    | { kind: 'matrimonios'; id: string; label: string }
    | { kind: 'misioneros'; id: string; label: string }
    | null
  >(null);

  const { data: conversion = [], isLoading: loadingConversion } = useInscripcionesConversion(retiroId);
  const { data: matrimonios = [], isLoading: loadingMatrimonios } = useInscripcionesMatrimonios(retiroId);
  const { data: misioneros = [], isLoading: loadingMisioneros } = useInscripcionesMisioneros(retiroId);

  const deleteConversion = useDeleteInscripcionConversion(retiroId);
  const deleteMatrimonios = useDeleteInscripcionMatrimonios(retiroId);
  const deleteMisionero = useDeleteInscripcionMisionero(retiroId);
  const toggleEsperaConversion = useCambiarEstadoEsperaConversion(retiroId);
  const toggleEsperaMatrimonios = useCambiarEstadoEsperaMatrimonios(retiroId);
  const createPago = useCreatePago(retiroId);
  const deletePago = useDeletePago(retiroId);
  const createConversion = useCreateInscripcionConversion(retiroId);
  const updateConversion = useUpdateInscripcionConversion(retiroId);
  const createMatrimonios = useCreateInscripcionMatrimonios(retiroId);
  const updateMatrimonios = useUpdateInscripcionMatrimonios(retiroId);
  const createMisionero = useCreateInscripcionMisionero(retiroId);
  const updateMisionero = useUpdateInscripcionMisionero(retiroId);

  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionTarget, setConversionTarget] = useState<ConversionRow | null>(null);
  const [conversionEspera, setConversionEspera] = useState(false);
  const [conversionForm, setConversionForm] = useState<InscripcionConversionInput>({
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
  });

  const [matrimoniosDialogOpen, setMatrimoniosDialogOpen] = useState(false);
  const [matrimoniosTarget, setMatrimoniosTarget] = useState<MatrimonioRow | null>(null);
  const [matrimoniosForm, setMatrimoniosForm] = useState<InscripcionMatrimoniosInput & {
    entrevista_realizada?: boolean;
    entrevista_fecha?: string;
    entrevista_notas?: string;
    en_espera?: boolean;
  }>({
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
  });

  const [misionerosDialogOpen, setMisionerosDialogOpen] = useState(false);
  const [misionerosTarget, setMisionerosTarget] = useState<MisioneroInscripcion | null>(null);
  const [misioneroSeleccionado, setMisioneroSeleccionado] = useState('');

  const handleCreatePago = (args: CreatePagoArgs) => createPago.mutateAsync(args);
  const handleDeletePago = (args: DeletePagoArgs) => deletePago.mutateAsync(args);

  const handleDeleteConversion = async (id: string) => {
    try {
      await deleteConversion.mutateAsync(id);
      toast.success('Inscripción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteMatrimonios = async (id: string) => {
    try {
      await deleteMatrimonios.mutateAsync(id);
      toast.success('Inscripción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteMisionero = async (id: string) => {
    try {
      await deleteMisionero.mutateAsync(id);
      toast.success('Inscripción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleEsperaConversion = async (id: string, enEspera: boolean) => {
    try {
      await toggleEsperaConversion.mutateAsync({ id, en_espera: !enEspera });
      toast.success(enEspera ? 'Movido a inscriptos' : 'Movido a lista de espera');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleToggleEsperaMatrimonios = async (id: string, enEspera: boolean) => {
    try {
      await toggleEsperaMatrimonios.mutateAsync({ id, en_espera: !enEspera });
      toast.success(enEspera ? 'Movido a inscriptos' : 'Movido a lista de espera');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const openCreateConversion = () => {
    setConversionTarget(null);
    setConversionEspera(false);
    setConversionForm({
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
    });
    setConversionDialogOpen(true);
  };

  const openEditConversion = (insc: ConversionRow) => {
    setConversionTarget(insc);
    setConversionEspera(!!insc.en_espera);
    setConversionForm({
      nombre: insc.nombre,
      apellido: insc.apellido,
      fecha_nacimiento: insc.fecha_nacimiento ?? '',
      dni: insc.dni,
      estado_civil: insc.estado_civil ?? '',
      domicilio: insc.domicilio ?? '',
      telefono: insc.telefono,
      contactos_emergencia: (insc.contactos_emergencia as InscripcionConversionInput['contactos_emergencia']) ?? [
        { nombre: '', whatsapp: '', relacion: '' },
        { nombre: '', whatsapp: '', relacion: '' },
        { nombre: '', whatsapp: '', relacion: '' },
      ],
      tiene_enfermedad: insc.tiene_enfermedad ?? false,
      enfermedad_detalle: insc.enfermedad_detalle ?? '',
      tiene_dieta_especial: insc.tiene_dieta_especial ?? false,
      dieta_especial_detalle: insc.dieta_especial_detalle ?? '',
      primer_retiro: insc.primer_retiro ?? true,
      bautizado: insc.bautizado ?? false,
    });
    setConversionDialogOpen(true);
  };

  const saveConversion = async () => {
    try {
      if (conversionTarget) {
        await updateConversion.mutateAsync({
          id: conversionTarget.id,
          input: { ...conversionForm, en_espera: conversionEspera },
        });
        toast.success('Inscripción actualizada');
      } else {
        await createConversion.mutateAsync({ ...conversionForm, en_espera: conversionEspera });
        toast.success('Inscripción creada');
      }
      setConversionDialogOpen(false);
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  const openCreateMatrimonios = () => {
    setMatrimoniosTarget(null);
    setMatrimoniosForm({
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
    });
    setMatrimoniosDialogOpen(true);
  };

  const openEditMatrimonios = (insc: MatrimonioRow) => {
    setMatrimoniosTarget(insc);
    setMatrimoniosForm({
      nombre_esposo: insc.nombre_esposo,
      apellido_esposo: insc.apellido_esposo,
      dni_esposo: insc.dni_esposo,
      fecha_nacimiento_esposo: insc.fecha_nacimiento_esposo ?? '',
      whatsapp_esposo: insc.whatsapp_esposo,
      nombre_esposa: insc.nombre_esposa,
      apellido_esposa: insc.apellido_esposa,
      dni_esposa: insc.dni_esposa,
      fecha_nacimiento_esposa: insc.fecha_nacimiento_esposa ?? '',
      whatsapp_esposa: insc.whatsapp_esposa,
      estado_relacion: insc.estado_relacion,
      domicilio: insc.domicilio ?? '',
      como_se_enteraron: insc.como_se_enteraron ?? '',
      entrevista_realizada: insc.entrevista_realizada ?? false,
      entrevista_fecha: insc.entrevista_fecha ?? '',
      entrevista_notas: insc.entrevista_notas ?? '',
      en_espera: insc.en_espera ?? false,
    });
    setMatrimoniosDialogOpen(true);
  };

  const saveMatrimonios = async () => {
    try {
      if (matrimoniosTarget) {
        await updateMatrimonios.mutateAsync({
          id: matrimoniosTarget.id,
          input: {
            ...matrimoniosForm,
            estado_relacion: matrimoniosForm.estado_relacion as EstadoRelacion,
          },
        });
        toast.success('Inscripción actualizada');
      } else {
        await createMatrimonios.mutateAsync({
          ...matrimoniosForm,
          estado_relacion: matrimoniosForm.estado_relacion as EstadoRelacion,
        });
        toast.success('Inscripción creada');
      }
      setMatrimoniosDialogOpen(false);
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  const openCreateMisioneros = () => {
    setMisionerosTarget(null);
    setMisioneroSeleccionado('');
    setMisionerosDialogOpen(true);
  };

  const openEditMisioneros = (insc: MisioneroInscripcion) => {
    setMisionerosTarget(insc);
    setMisioneroSeleccionado(insc.misionero_id ?? '');
    setMisionerosDialogOpen(true);
  };

  const saveMisioneros = async () => {
    if (!misioneroSeleccionado) return;
    try {
      if (misionerosTarget) {
        await updateMisionero.mutateAsync({ id: misionerosTarget.id, misioneroId: misioneroSeleccionado });
        toast.success('Inscripción actualizada');
      } else {
        await createMisionero.mutateAsync(misioneroSeleccionado);
        toast.success('Inscripción creada');
      }
      setMisionerosDialogOpen(false);
    } catch {
      toast.error('Error al guardar inscripción');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white border border-brand-creamLight rounded-lg p-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-brown" />
          <span className="font-medium">{stats?.inscriptos ?? 0} Inscriptos</span>
        </div>
        <div className="bg-white border border-brand-creamLight rounded-lg p-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-brand-teal" />
          <span className="font-medium">{stats?.enEspera ?? 0} En espera</span>
        </div>
        <div className="bg-white border border-brand-creamLight rounded-lg p-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="font-medium">
            ${((stats?.totalRecaudado ?? 0) as number).toLocaleString('es-AR')}
          </span>
        </div>
      </div>

      {tipo === 'conversion' && (
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-visible">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20 flex items-center justify-between gap-3">
            <h3 className="font-medium text-brand-dark">Inscripciones de Conversión</h3>
            <Button size="sm" variant="outline" onClick={openCreateConversion}>+ Inscribir</Button>
          </div>
          {loadingConversion ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : conversion.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {conversion.map((insc) => (
                <ConversionInscripcionRow
                  key={insc.id}
                  inscripcion={insc}
                  onEdit={() => openEditConversion(insc)}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: 'conversion',
                      id: insc.id,
                      label: `${insc.nombre} ${insc.apellido}`,
                    })
                  }
                  onToggleEspera={(enEspera) => handleToggleEsperaConversion(insc.id, enEspera)}
                  onCreatePago={handleCreatePago}
                  onDeletePago={handleDeletePago}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tipo === 'matrimonios' && (
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-visible">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20 flex items-center justify-between gap-3">
            <h3 className="font-medium text-brand-dark">Inscripciones de Matrimonios</h3>
            <Button size="sm" variant="outline" onClick={openCreateMatrimonios}>+ Inscribir</Button>
          </div>
          {loadingMatrimonios ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : matrimonios.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {matrimonios.map((insc) => (
                <MatrimonioInscripcionRow
                  key={insc.id}
                  inscripcion={insc}
                  onEdit={() => openEditMatrimonios(insc)}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: 'matrimonios',
                      id: insc.id,
                      label: `${insc.nombre_esposo} ${insc.apellido_esposo} & ${insc.nombre_esposa} ${insc.apellido_esposa}`,
                    })
                  }
                  onToggleEspera={(enEspera) => handleToggleEsperaMatrimonios(insc.id, enEspera)}
                  onCreatePago={handleCreatePago}
                  onDeletePago={handleDeletePago}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tipo === 'misioneros' && (
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-visible">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20 flex items-center justify-between gap-3">
            <h3 className="font-medium text-brand-dark">Inscripciones de Misioneros</h3>
            <Button size="sm" variant="outline" onClick={openCreateMisioneros}>+ Inscribir</Button>
          </div>
          {loadingMisioneros ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : misioneros.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {misioneros.map((insc) => (
                <div key={insc.id} className="p-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-dark break-words whitespace-normal">
                      {insc.misioneros?.nombre} {insc.misioneros?.apellido}
                    </p>
                    <p className="text-sm text-brand-brown">DNI: {insc.misioneros?.dni}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditMisioneros(insc as MisioneroInscripcion)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() =>
                        setDeleteTarget({
                          kind: 'misioneros',
                          id: insc.id,
                          label: `${insc.misioneros?.nombre ?? ''} ${insc.misioneros?.apellido ?? ''}`.trim(),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="md:hidden">
                    <ActionMenu
                      items={[
                        { label: 'Editar', onClick: () => openEditMisioneros(insc as MisioneroInscripcion) },
                        {
                          label: 'Eliminar',
                          onClick: () =>
                            setDeleteTarget({
                              kind: 'misioneros',
                              id: insc.id,
                              label: `${insc.misioneros?.nombre ?? ''} ${insc.misioneros?.apellido ?? ''}`.trim(),
                            }),
                          tone: 'danger',
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la inscripción <strong>{deleteTarget?.label}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return;
                if (deleteTarget.kind === 'conversion') await handleDeleteConversion(deleteTarget.id);
                if (deleteTarget.kind === 'matrimonios') await handleDeleteMatrimonios(deleteTarget.id);
                if (deleteTarget.kind === 'misioneros') await handleDeleteMisionero(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={conversionDialogOpen} onOpenChange={setConversionDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{conversionTarget ? 'Editar inscripto' : 'Nuevo inscripto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-3 gap-3">
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
          <div className="flex justify-end">
            <Button onClick={saveConversion}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={matrimoniosDialogOpen} onOpenChange={setMatrimoniosDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{matrimoniosTarget ? 'Editar inscripto' : 'Nuevo inscripto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Nombre esposo" value={matrimoniosForm.nombre_esposo} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, nombre_esposo: e.target.value }))} />
            <Input placeholder="Apellido esposo" value={matrimoniosForm.apellido_esposo} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, apellido_esposo: e.target.value }))} />
            <Input placeholder="DNI esposo" value={matrimoniosForm.dni_esposo} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, dni_esposo: e.target.value }))} />
            <Input placeholder="WhatsApp esposo" value={matrimoniosForm.whatsapp_esposo} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, whatsapp_esposo: e.target.value }))} />
            <Input type="date" value={matrimoniosForm.fecha_nacimiento_esposo} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, fecha_nacimiento_esposo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Nombre esposa" value={matrimoniosForm.nombre_esposa} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, nombre_esposa: e.target.value }))} />
            <Input placeholder="Apellido esposa" value={matrimoniosForm.apellido_esposa} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, apellido_esposa: e.target.value }))} />
            <Input placeholder="DNI esposa" value={matrimoniosForm.dni_esposa} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, dni_esposa: e.target.value }))} />
            <Input placeholder="WhatsApp esposa" value={matrimoniosForm.whatsapp_esposa} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, whatsapp_esposa: e.target.value }))} />
            <Input type="date" value={matrimoniosForm.fecha_nacimiento_esposa} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, fecha_nacimiento_esposa: e.target.value }))} />
          </div>
          <Select value={matrimoniosForm.estado_relacion} onValueChange={(v) => setMatrimoniosForm((p) => ({ ...p, estado_relacion: v as EstadoRelacion }))}>
            <SelectTrigger><SelectValue placeholder="Estado de relación" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_RELACION_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Domicilio" value={matrimoniosForm.domicilio} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, domicilio: e.target.value }))} />
          <Input placeholder="Cómo se enteraron" value={matrimoniosForm.como_se_enteraron} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, como_se_enteraron: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!matrimoniosForm.entrevista_realizada} onCheckedChange={(c) => setMatrimoniosForm((p) => ({ ...p, entrevista_realizada: !!c }))} />
              Entrevista realizada
            </label>
            <Input type="date" value={matrimoniosForm.entrevista_fecha ?? ''} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, entrevista_fecha: e.target.value }))} />
          </div>
          <Textarea placeholder="Notas entrevista" value={matrimoniosForm.entrevista_notas ?? ''} onChange={(e) => setMatrimoniosForm((p) => ({ ...p, entrevista_notas: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!matrimoniosForm.en_espera} onCheckedChange={(c) => setMatrimoniosForm((p) => ({ ...p, en_espera: !!c }))} />
            En espera
          </label>
          <div className="flex justify-end">
            <Button onClick={saveMatrimonios}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={misionerosDialogOpen} onOpenChange={setMisionerosDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{misionerosTarget ? 'Editar inscripto' : 'Nuevo inscripto'}</DialogTitle>
          </DialogHeader>
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
          <div className="flex justify-end">
            <Button onClick={saveMisioneros} disabled={!misioneroSeleccionado}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConversionInscripcionRow({
  inscripcion,
  onEdit,
  onDelete,
  onToggleEspera,
  onCreatePago,
  onDeletePago,
}: {
  inscripcion: ConversionRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEspera: (enEspera: boolean) => void;
  onCreatePago: (args: CreatePagoArgs) => Promise<unknown>;
  onDeletePago: (args: DeletePagoArgs) => Promise<unknown>;
}) {
  const [pagoOpen, setPagoOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const { data: pagos = [] } = usePagosByInscripcion('conversion', inscripcion.id);

  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

  const handleRegistrarPago = async () => {
    if (!monto) return;
    try {
      await onCreatePago({
        tipoInscripcion: 'conversion',
        inscripcionId: inscripcion.id,
        input: {
          monto: Number(monto),
          metodo,
          fecha: new Date().toISOString().split('T')[0],
          notas: '',
        },
      });
      toast.success('Pago registrado');
      setPagoOpen(false);
      setMonto('');
    } catch {
      toast.error('Error al registrar pago');
    }
  };

  const [deletePagoId, setDeletePagoId] = useState<string | null>(null);

  const handleEliminarPago = async (id: string) => {
    try {
      await onDeletePago({ id, tipoInscripcion: 'conversion', inscripcionId: inscripcion.id });
      toast.success('Pago eliminado');
    } catch {
      toast.error('Error al eliminar pago');
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-dark break-words whitespace-normal">
            {inscripcion.nombre} {inscripcion.apellido}
          </p>
          <p className="text-sm text-brand-brown">DNI: {inscripcion.dni} · Tel: {inscripcion.telefono}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {inscripcion.en_espera ? (
            <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleEspera(inscripcion.en_espera)}>
            {inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera'}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="md:hidden">
          <ActionMenu
            items={[
              { label: 'Editar', onClick: onEdit },
              { label: inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera', onClick: () => onToggleEspera(inscripcion.en_espera) },
              { label: 'Eliminar', onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium">${totalPagado.toLocaleString('es-AR')}</span>
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              <Plus className="w-3 h-3 mr-1" /> Registrar pago
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Monto ($)</label>
                <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Método</label>
                <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METODO_PAGO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRegistrarPago} disabled={!monto} className="w-full">
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pagos.length > 0 && (
        <div className="bg-brand-cream/40 rounded-lg p-3 text-sm space-y-2">
          {pagos.map((pago) => (
            <div key={pago.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-brand-dark">${Number(pago.monto).toLocaleString('es-AR')}</p>
                <p className="text-brand-brown/70">
                  {METODO_PAGO_LABEL[pago.metodo]} · {new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() => setDeletePagoId(pago.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletePagoId} onOpenChange={(open) => !open && setDeletePagoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletePagoId) return;
                await handleEliminarPago(deletePagoId);
                setDeletePagoId(null);
              }}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MatrimonioInscripcionRow({
  inscripcion,
  onEdit,
  onDelete,
  onToggleEspera,
  onCreatePago,
  onDeletePago,
}: {
  inscripcion: MatrimonioRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEspera: (enEspera: boolean) => void;
  onCreatePago: (args: CreatePagoArgs) => Promise<unknown>;
  onDeletePago: (args: DeletePagoArgs) => Promise<unknown>;
}) {
  const [pagoOpen, setPagoOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const { data: pagos = [] } = usePagosByInscripcion('matrimonios', inscripcion.id);

  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

  const handleRegistrarPago = async () => {
    if (!monto) return;
    try {
      await onCreatePago({
        tipoInscripcion: 'matrimonios',
        inscripcionId: inscripcion.id,
        input: {
          monto: Number(monto),
          metodo,
          fecha: new Date().toISOString().split('T')[0],
          notas: '',
        },
      });
      toast.success('Pago registrado');
      setPagoOpen(false);
      setMonto('');
    } catch {
      toast.error('Error al registrar pago');
    }
  };

  const [deletePagoId, setDeletePagoId] = useState<string | null>(null);

  const handleEliminarPago = async (id: string) => {
    try {
      await onDeletePago({ id, tipoInscripcion: 'matrimonios', inscripcionId: inscripcion.id });
      toast.success('Pago eliminado');
    } catch {
      toast.error('Error al eliminar pago');
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-dark break-words whitespace-normal">
            {inscripcion.nombre_esposo} {inscripcion.apellido_esposo} & {inscripcion.nombre_esposa} {inscripcion.apellido_esposa}
          </p>
          <p className="text-sm text-brand-brown">
            Estado: {inscripcion.estado_relacion} · {inscripcion.entrevista_realizada ? 'Entrevistados' : 'Sin entrevista'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {inscripcion.en_espera ? (
            <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleEspera(inscripcion.en_espera)}>
            {inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera'}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="md:hidden">
          <ActionMenu
            items={[
              { label: 'Editar', onClick: onEdit },
              { label: inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera', onClick: () => onToggleEspera(inscripcion.en_espera) },
              { label: 'Eliminar', onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium">${totalPagado.toLocaleString('es-AR')}</span>
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              <Plus className="w-3 h-3 mr-1" /> Registrar pago
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Monto ($)</label>
                <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Método</label>
                <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METODO_PAGO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRegistrarPago} disabled={!monto} className="w-full">
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pagos.length > 0 && (
        <div className="bg-brand-cream/40 rounded-lg p-3 text-sm space-y-2">
          {pagos.map((pago) => (
            <div key={pago.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-brand-dark">${Number(pago.monto).toLocaleString('es-AR')}</p>
                <p className="text-brand-brown/70">
                  {METODO_PAGO_LABEL[pago.metodo]} · {new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() => setDeletePagoId(pago.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletePagoId} onOpenChange={(open) => !open && setDeletePagoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletePagoId) return;
                await handleEliminarPago(deletePagoId);
                setDeletePagoId(null);
              }}
              className="bg-red-500 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
