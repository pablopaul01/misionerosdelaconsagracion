'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  
} from '@/lib/queries/retiros';
import { METODO_PAGO_LABEL } from '@/lib/constants/retiros';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { Trash2, Users, UserCheck, DollarSign, Plus, MoreVertical, FileDown, ChevronDown } from 'lucide-react';
import type { Database } from '@/types/supabase';
import type { PagoInput } from '@/lib/validations/retiros';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];
type MetodoPago = Database['public']['Enums']['metodo_pago'];
type ConversionRow = Database['public']['Tables']['inscripciones_retiro_conversion']['Row'];
type MatrimonioRow = Database['public']['Tables']['inscripciones_retiro_matrimonios']['Row'];
type MisioneroRow = Database['public']['Tables']['inscripciones_retiro_misioneros']['Row'] & {
  misioneros: Database['public']['Tables']['misioneros']['Row'] | null;
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

type EstadoFiltro = 'todos' | 'inscriptos' | 'enEspera';

type ContactoEmergencia = {
  nombre?: string;
  whatsapp?: string;
  relacion?: string;
};

const parseContactosEmergencia = (contactos: unknown): ContactoEmergencia[] => {
  const normalize = (value: unknown): ContactoEmergencia[] => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        nombre: typeof item.nombre === 'string' ? item.nombre : '',
        whatsapp: typeof item.whatsapp === 'string' ? item.whatsapp : '',
        relacion: typeof item.relacion === 'string' ? item.relacion : '',
      }));
  };

  if (Array.isArray(contactos)) {
    return normalize(contactos);
  }

  if (typeof contactos === 'string') {
    try {
      const parsed = JSON.parse(contactos) as unknown;
      return normalize(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

const formatUiDate = (value: string | null | undefined, hasTime = false): string => {
  if (!value) return 'No informado';
  const date = new Date(hasTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'No informado';
  return date.toLocaleDateString('es-AR');
};

const formatUiBoolean = (value: boolean | null | undefined): string => (value ? 'Si' : 'No');

const formatUiText = (value: string | null | undefined): string => value?.trim() || 'No informado';

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-brand-brown/10 bg-brand-cream/30 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-brown/70">{label}</p>
      <p className="mt-1 text-sm text-brand-dark break-words whitespace-normal">{value}</p>
    </div>
  );
}

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
        className="h-9 w-9 flex items-center justify-center rounded-md border border-brand-creamLight bg-white text-brand-brown"
        aria-label="Abrir acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-brand-creamLight rounded-lg shadow-lg z-50">
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
  const router = useRouter();
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');

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

  const goToConversionNew = () => router.push(`/admin/retiros/${retiroId}/inscripciones/conversion/nuevo`);
  const goToConversionEdit = (id: string) => router.push(`/admin/retiros/${retiroId}/inscripciones/conversion/${id}`);
  const goToMatrimoniosNew = () => router.push(`/admin/retiros/${retiroId}/inscripciones/matrimonios/nuevo`);
  const goToMatrimoniosEdit = (id: string) => router.push(`/admin/retiros/${retiroId}/inscripciones/matrimonios/${id}`);
  const goToMisionerosNew = () => router.push(`/admin/retiros/${retiroId}/inscripciones/misioneros/nuevo`);
  const goToMisionerosEdit = (id: string) => router.push(`/admin/retiros/${retiroId}/inscripciones/misioneros/${id}`);

  const exportarExcel = async () => {
    const XLSX = await import('xlsx-js-style');

    // ── Conversion ────────────────────────────────────────────────────
    const convRows = [...conversion].sort((a, b) => (a.apellido ?? '').localeCompare(b.apellido ?? '', 'es', { sensitivity: 'base' }))
      .map((i, idx) => {
        const contactosEmergencia = parseContactosEmergencia(i.contactos_emergencia);
        const contacto1 = contactosEmergencia[0];
        const contacto2 = contactosEmergencia[1];
        const contacto3 = contactosEmergencia[2];

        return {
          'Nº': idx + 1,
          'Apellido': i.apellido,
          'Nombre': i.nombre,
          'Fecha nacimiento': i.fecha_nacimiento ? new Date(i.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR') : '',
          'DNI': i.dni ?? '',
          'Estado civil': i.estado_civil ?? '',
          'Domicilio': i.domicilio ?? '',
          'Teléfono': i.telefono ?? '',
          'Nombre contacto 1': contacto1?.nombre ?? '',
          'Whatsapp contacto 1': contacto1?.whatsapp ?? '',
          'Relacion contacto 1': contacto1?.relacion ?? '',
          'Nombre contacto 2': contacto2?.nombre ?? '',
          'Whatsapp contacto 2': contacto2?.whatsapp ?? '',
          'Relacion contacto 2': contacto2?.relacion ?? '',
          'Nombre contacto 3': contacto3?.nombre ?? '',
          'Whatsapp contacto 3': contacto3?.whatsapp ?? '',
          'Relacion contacto 3': contacto3?.relacion ?? '',
          'Tiene enfermedad': i.tiene_enfermedad ? 'Sí' : 'No',
          'Enfermedad detalle': i.enfermedad_detalle ?? '',
          'Dieta especial': i.tiene_dieta_especial ? 'Sí' : 'No',
          'Dieta detalle': i.dieta_especial_detalle ?? '',
          'Primer retiro': i.primer_retiro ? 'Sí' : 'No',
          'Bautizado': i.bautizado ? 'Sí' : 'No',
          'Sacramentos': ((i.sacramentos as string[]) ?? []).join(', '),
          'En espera': i.en_espera ? 'Sí' : 'No',
          'Fecha inscripción': i.created_at ? new Date(i.created_at).toLocaleDateString('es-AR') : '',
        };
      });

    // ── Matrimonios ─────────────────────────────────────────────
    const matriRows = [...matrimonios].sort((a, b) => (a.apellido_esposo ?? '').localeCompare(b.apellido_esposo ?? '', 'es', { sensitivity: 'base' }))
      .map((i, idx) => ({
        'Nº': idx + 1,
        'Apellido esposo': i.apellido_esposo,
        'Nombre esposo': i.nombre_esposo,
        'DNI esposo': i.dni_esposo ?? '',
        'Fecha nacimiento esposo': i.fecha_nacimiento_esposo ? new Date(i.fecha_nacimiento_esposo + 'T00:00:00').toLocaleDateString('es-AR') : '',
        'WhatsApp esposo': i.whatsapp_esposo ?? '',
        'Apellido esposa': i.apellido_esposa,
        'Nombre esposa': i.nombre_esposa,
        'DNI esposa': i.dni_esposa ?? '',
        'Fecha nacimiento esposa': i.fecha_nacimiento_esposa ? new Date(i.fecha_nacimiento_esposa + 'T00:00:00').toLocaleDateString('es-AR') : '',
        'WhatsApp esposa': i.whatsapp_esposa ?? '',
        'Estado relación': i.estado_relacion ?? '',
        'Domicilio': i.domicilio ?? '',
        'Cómo se enteraron': i.como_se_enteraron ?? '',
        'Entrevista': i.entrevista_realizada ? 'Sí' : 'No',
        'Fecha entrevista': i.entrevista_fecha ? new Date(i.entrevista_fecha + 'T00:00:00').toLocaleDateString('es-AR') : '',
        'Notas entrevista': i.entrevista_notas ?? '',
        'En espera': i.en_espera ? 'Sí' : 'No',
        'Fecha inscripción': i.created_at ? new Date(i.created_at).toLocaleDateString('es-AR') : '',
      }));

    // ── Misioneros ──────────────────────────────────────────────────────
    const misiRows = [...misioneros].sort((a, b) => (a.misioneros?.apellido ?? '').localeCompare(b.misioneros?.apellido ?? '', 'es', { sensitivity: 'base' }))
      .map((i, idx) => ({
        'Nº': idx + 1,
        'Apellido': i.misioneros?.apellido ?? '',
        'Nombre': i.misioneros?.nombre ?? '',
        'DNI': i.misioneros?.dni ?? '',
        'Fecha nacimiento': i.misioneros?.fecha_nacimiento ? new Date(i.misioneros.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR') : '',
        'Teléfono': i.misioneros?.whatsapp ?? '',
        'Fecha inscripción': i.created_at ? new Date(i.created_at).toLocaleDateString('es-AR') : '',
      }));

    const wb = XLSX.utils.book_new();

    if (convRows.length > 0) {
      const wsConv = XLSX.utils.json_to_sheet(convRows);
      XLSX.utils.book_append_sheet(wb, wsConv, 'Conversión');
    }
    if (matriRows.length > 0) {
      const wsMatri = XLSX.utils.json_to_sheet(matriRows);
      XLSX.utils.book_append_sheet(wb, wsMatri, 'Matrimonios');
    }
    if (misiRows.length > 0) {
      const wsMisi = XLSX.utils.json_to_sheet(misiRows);
      XLSX.utils.book_append_sheet(wb, wsMisi, 'Misioneros');
    }

    XLSX.writeFile(wb, `Inscripciones_${retiroId}.xlsx`);
  };

  const allInscripciones = [
    ...conversion.map((i) => ({ id: i.id })),
    ...matrimonios.map((i) => ({ id: i.id })),
    ...misioneros.map((i) => ({ id: i.id })),
  ];

  const coincideConFiltro = (enEspera: boolean | undefined): boolean => {
    if (estadoFiltro === 'todos') return true;
    if (estadoFiltro === 'inscriptos') return enEspera !== true;
    return enEspera === true;
  };

  const conversionFiltradas = conversion.filter((inscripcion) => coincideConFiltro(inscripcion.en_espera));
  const matrimoniosFiltradas = matrimonios.filter((inscripcion) => coincideConFiltro(inscripcion.en_espera));
  const misionerosFiltrados = misioneros.filter(() => coincideConFiltro(undefined));

  const filtrosEstado: { value: EstadoFiltro; label: string; count: number; icon: typeof Users }[] = [
    { value: 'todos', label: 'Todos', count: (stats?.inscriptos ?? 0) + (stats?.enEspera ?? 0), icon: Users },
    { value: 'inscriptos', label: 'Inscriptos', count: stats?.inscriptos ?? 0, icon: Users },
    { value: 'enEspera', label: 'En espera', count: stats?.enEspera ?? 0, icon: UserCheck },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {filtrosEstado.map(({ value, label, count, icon: Icon }) => {
            const isActive = estadoFiltro === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setEstadoFiltro(value)}
                aria-pressed={isActive}
                className={`rounded-lg border p-3 flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-brand-brown bg-brand-cream text-brand-dark'
                    : 'border-brand-creamLight bg-white text-brand-brown hover:bg-brand-cream/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${value === 'enEspera' ? 'text-brand-teal' : 'text-brand-brown'}`} />
                <span className="font-medium">{count} {label}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-white border border-brand-creamLight rounded-lg p-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="font-medium">
            ${((stats?.totalRecaudado ?? 0) as number).toLocaleString('es-AR')}
          </span>
        </div>
        {allInscripciones.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="border-brand-brown text-brand-brown hover:bg-brand-cream"
            onClick={exportarExcel}
          >
            <FileDown className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        )}
      </div>

      {tipo === 'conversion' && (
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-visible">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20 flex items-center justify-between gap-3">
            <h3 className="font-medium text-brand-dark">Inscripciones de Conversión</h3>
            <Button size="sm" variant="outline" onClick={goToConversionNew}>+ Inscribir</Button>
          </div>
          {loadingConversion ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : conversionFiltradas.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {conversionFiltradas.map((insc) => (
                <ConversionInscripcionRow
                  key={insc.id}
                  inscripcion={insc}
                  onEdit={() => goToConversionEdit(insc.id)}
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
            <Button size="sm" variant="outline" onClick={goToMatrimoniosNew}>+ Inscribir</Button>
          </div>
          {loadingMatrimonios ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : matrimoniosFiltradas.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {matrimoniosFiltradas.map((insc) => (
                <MatrimonioInscripcionRow
                  key={insc.id}
                  inscripcion={insc}
                  onEdit={() => goToMatrimoniosEdit(insc.id)}
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
            <Button size="sm" variant="outline" onClick={goToMisionerosNew}>+ Inscribir</Button>
          </div>
          {loadingMisioneros ? (
            <p className="p-4 text-brand-brown">Cargando...</p>
          ) : misionerosFiltrados.length === 0 ? (
            <p className="p-4 text-brand-brown">No hay inscripciones</p>
          ) : (
            <div className="divide-y divide-brand-brown/10">
              {misionerosFiltrados.map((insc) => (
                <MisioneroInscripcionRow
                  key={insc.id}
                  inscripcion={insc}
                  onEdit={() => goToMisionerosEdit(insc.id)}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: 'misioneros',
                      id: insc.id,
                      label: `${insc.misioneros?.nombre ?? ''} ${insc.misioneros?.apellido ?? ''}`.trim(),
                    })
                  }
                />
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
  const [expanded, setExpanded] = useState(false);
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
  const contactosEmergencia = parseContactosEmergencia(inscripcion.contactos_emergencia);
  const contacto1 = contactosEmergencia[0];
  const contacto2 = contactosEmergencia[1];
  const contacto3 = contactosEmergencia[2];

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-dark break-words whitespace-normal">
              {inscripcion.nombre} {inscripcion.apellido}
            </p>
            {inscripcion.en_espera ? (
              <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
            )}
          </div>
          <p className="text-sm text-brand-brown break-words">DNI: {formatUiText(inscripcion.dni)} · Tel: {formatUiText(inscripcion.telefono)}</p>
          <p className="text-xs text-brand-brown/80">{inscripcion.primer_retiro ? 'Primer retiro' : 'Ya participo en retiros'} </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ActionMenu
            items={[
              { label: 'Editar', onClick: onEdit },
              { label: inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera', onClick: () => onToggleEspera(inscripcion.en_espera) },
              { label: 'Eliminar', onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium">${totalPagado.toLocaleString('es-AR')}</span>
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="sm:ml-2">
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
                <label className="text-sm font-medium">Metodo</label>
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

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-fit px-2"
      >
        {expanded ? 'Ver menos' : 'Ver más datos'}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </Button>

      {expanded && (
        <div className="rounded-lg border border-brand-brown/10 bg-brand-cream/20 p-3 sm:p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">Datos completos</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Fecha de nacimiento" value={formatUiDate(inscripcion.fecha_nacimiento)} />
              <DetailItem label="Estado civil" value={formatUiText(inscripcion.estado_civil)} />
              <DetailItem label="Domicilio" value={formatUiText(inscripcion.domicilio)} />
              <DetailItem label="Tiene enfermedad" value={formatUiBoolean(inscripcion.tiene_enfermedad)} />
              <DetailItem label="Detalle enfermedad" value={formatUiText(inscripcion.enfermedad_detalle)} />
              <DetailItem label="Dieta especial" value={formatUiBoolean(inscripcion.tiene_dieta_especial)} />
              <DetailItem label="Detalle dieta" value={formatUiText(inscripcion.dieta_especial_detalle)} />
              <DetailItem label="Sacramentos" value={((inscripcion.sacramentos as string[]) ?? []).join(', ') || 'No informado'} />
              <DetailItem label="Fecha de inscripcion" value={formatUiDate(inscripcion.created_at, true)} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">Contactos de emergencia</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-md border border-brand-brown/10 bg-white p-2.5 space-y-1">
                <p className="text-xs font-medium text-brand-brown/70">Contacto 1</p>
                <p className="text-sm text-brand-dark break-words">{formatUiText(contacto1?.nombre)}</p>
                <p className="text-xs text-brand-brown break-words">Wsp: {formatUiText(contacto1?.whatsapp)}</p>
                <p className="text-xs text-brand-brown break-words">Relacion: {formatUiText(contacto1?.relacion)}</p>
              </div>
              <div className="rounded-md border border-brand-brown/10 bg-white p-2.5 space-y-1">
                <p className="text-xs font-medium text-brand-brown/70">Contacto 2</p>
                <p className="text-sm text-brand-dark break-words">{formatUiText(contacto2?.nombre)}</p>
                <p className="text-xs text-brand-brown break-words">Wsp: {formatUiText(contacto2?.whatsapp)}</p>
                <p className="text-xs text-brand-brown break-words">Relacion: {formatUiText(contacto2?.relacion)}</p>
              </div>
              <div className="rounded-md border border-brand-brown/10 bg-white p-2.5 space-y-1">
                <p className="text-xs font-medium text-brand-brown/70">Contacto 3</p>
                <p className="text-sm text-brand-dark break-words">{formatUiText(contacto3?.nombre)}</p>
                <p className="text-xs text-brand-brown break-words">Wsp: {formatUiText(contacto3?.whatsapp)}</p>
                <p className="text-xs text-brand-brown break-words">Relacion: {formatUiText(contacto3?.relacion)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
  const [expanded, setExpanded] = useState(false);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-dark break-words whitespace-normal">
              {inscripcion.nombre_esposo} {inscripcion.apellido_esposo} & {inscripcion.nombre_esposa} {inscripcion.apellido_esposa}
            </p>
            {inscripcion.en_espera ? (
              <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
            )}
          </div>
          <p className="text-sm text-brand-brown break-words">
            Estado: {formatUiText(inscripcion.estado_relacion)} · {inscripcion.entrevista_realizada ? 'Entrevistados' : 'Sin entrevista'}
          </p>
          <p className="text-xs text-brand-brown/80 break-words">
            DNI esposo: {formatUiText(inscripcion.dni_esposo)} · DNI esposa: {formatUiText(inscripcion.dni_esposa)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ActionMenu
            items={[
              { label: 'Editar', onClick: onEdit },
              { label: inscripcion.en_espera ? 'Confirmar' : 'Pasar a espera', onClick: () => onToggleEspera(inscripcion.en_espera) },
              { label: 'Eliminar', onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium">${totalPagado.toLocaleString('es-AR')}</span>
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="sm:ml-2">
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
                <label className="text-sm font-medium">Metodo</label>
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

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-fit px-2"
      >
        {expanded ? 'Ver menos' : 'Ver más datos'}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </Button>

      {expanded && (
        <div className="rounded-lg border border-brand-brown/10 bg-brand-cream/20 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">Datos completos</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Nombre esposo" value={`${inscripcion.nombre_esposo ?? ''} ${inscripcion.apellido_esposo ?? ''}`.trim() || 'No informado'} />
            <DetailItem label="DNI esposo" value={formatUiText(inscripcion.dni_esposo)} />
            <DetailItem label="Nacimiento esposo" value={formatUiDate(inscripcion.fecha_nacimiento_esposo)} />
            <DetailItem label="WhatsApp esposo" value={formatUiText(inscripcion.whatsapp_esposo)} />
            <DetailItem label="Nombre esposa" value={`${inscripcion.nombre_esposa ?? ''} ${inscripcion.apellido_esposa ?? ''}`.trim() || 'No informado'} />
            <DetailItem label="DNI esposa" value={formatUiText(inscripcion.dni_esposa)} />
            <DetailItem label="Nacimiento esposa" value={formatUiDate(inscripcion.fecha_nacimiento_esposa)} />
            <DetailItem label="WhatsApp esposa" value={formatUiText(inscripcion.whatsapp_esposa)} />
            <DetailItem label="Estado relacion" value={formatUiText(inscripcion.estado_relacion)} />
            <DetailItem label="Domicilio" value={formatUiText(inscripcion.domicilio)} />
            <DetailItem label="Como se enteraron" value={formatUiText(inscripcion.como_se_enteraron)} />
            <DetailItem label="Entrevista realizada" value={formatUiBoolean(inscripcion.entrevista_realizada)} />
            <DetailItem label="Fecha entrevista" value={formatUiDate(inscripcion.entrevista_fecha)} />
            <DetailItem label="Notas entrevista" value={formatUiText(inscripcion.entrevista_notas)} />
            <DetailItem label="Fecha de inscripcion" value={formatUiDate(inscripcion.created_at, true)} />
          </div>
        </div>
      )}

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

function MisioneroInscripcionRow({
  inscripcion,
  onEdit,
  onDelete,
}: {
  inscripcion: MisioneroRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-dark break-words whitespace-normal">
            {inscripcion.misioneros?.nombre} {inscripcion.misioneros?.apellido}
          </p>
          <p className="text-sm text-brand-brown break-words">
            DNI: {formatUiText(inscripcion.misioneros?.dni)} · Tel: {formatUiText(inscripcion.misioneros?.whatsapp)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <ActionMenu
            items={[
              { label: 'Editar', onClick: onEdit },
              { label: 'Eliminar', onClick: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-fit px-2"
      >
        {expanded ? 'Ver menos' : 'Ver más datos'}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </Button>

      {expanded && (
        <div className="rounded-lg border border-brand-brown/10 bg-brand-cream/20 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">Datos completos</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Nombre" value={formatUiText(inscripcion.misioneros?.nombre)} />
            <DetailItem label="Apellido" value={formatUiText(inscripcion.misioneros?.apellido)} />
            <DetailItem label="DNI" value={formatUiText(inscripcion.misioneros?.dni)} />
            <DetailItem label="Fecha de nacimiento" value={formatUiDate(inscripcion.misioneros?.fecha_nacimiento)} />
            <DetailItem label="Telefono" value={formatUiText(inscripcion.misioneros?.whatsapp)} />
            <DetailItem label="Fecha de inscripcion" value={formatUiDate(inscripcion.created_at, true)} />
          </div>
        </div>
      )}
    </div>
  );
}
