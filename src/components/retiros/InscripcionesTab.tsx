'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Users, UserCheck, DollarSign, Plus } from 'lucide-react';
import type { Database } from '@/types/supabase';
import type { PagoInput } from '@/lib/validations/retiros';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];
type MetodoPago = Database['public']['Enums']['metodo_pago'];
type ConversionRow = Database['public']['Tables']['inscripciones_retiro_conversion']['Row'];
type MatrimonioRow = Database['public']['Tables']['inscripciones_retiro_matrimonios']['Row'];

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

export function InscripcionesTab({ retiroId, tipo }: InscripcionesTabProps) {
  const { data: stats } = useEstadisticasRetiro(retiroId, tipo);

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
    if (!confirm('¿Eliminar inscripción?')) return;
    try {
      await deleteConversion.mutateAsync(id);
      toast.success('Inscripción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteMatrimonios = async (id: string) => {
    if (!confirm('¿Eliminar inscripción?')) return;
    try {
      await deleteMatrimonios.mutateAsync(id);
      toast.success('Inscripción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteMisionero = async (id: string) => {
    if (!confirm('¿Eliminar inscripción?')) return;
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
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20">
            <h3 className="font-medium text-brand-dark">Inscripciones de Conversión</h3>
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
                  onDelete={() => handleDeleteConversion(insc.id)}
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
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20">
            <h3 className="font-medium text-brand-dark">Inscripciones de Matrimonios</h3>
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
                  onDelete={() => handleDeleteMatrimonios(insc.id)}
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
        <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
          <div className="p-3 bg-brand-creamLight border-b border-brand-brown/20">
            <h3 className="font-medium text-brand-dark">Inscripciones de Misioneros</h3>
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
                    <p className="font-medium text-brand-dark truncate">
                      {insc.misioneros?.nombre} {insc.misioneros?.apellido}
                    </p>
                    <p className="text-sm text-brand-brown">DNI: {insc.misioneros?.dni}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteMisionero(insc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConversionInscripcionRow({
  inscripcion,
  onDelete,
  onToggleEspera,
  onCreatePago,
  onDeletePago,
}: {
  inscripcion: ConversionRow;
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

  const handleEliminarPago = async (id: string) => {
    if (!confirm('¿Eliminar pago?')) return;
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
          <p className="font-medium text-brand-dark truncate">
            {inscripcion.nombre} {inscripcion.apellido}
          </p>
          <p className="text-sm text-brand-brown">DNI: {inscripcion.dni} · Tel: {inscripcion.telefono}</p>
        </div>
        <div className="flex items-center gap-2">
          {inscripcion.en_espera ? (
            <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => onToggleEspera(inscripcion.en_espera)}>
            {inscripcion.en_espera ? 'Confirmar' : 'Espera'}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
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
                onClick={() => handleEliminarPago(pago.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatrimonioInscripcionRow({
  inscripcion,
  onDelete,
  onToggleEspera,
  onCreatePago,
  onDeletePago,
}: {
  inscripcion: MatrimonioRow;
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

  const handleEliminarPago = async (id: string) => {
    if (!confirm('¿Eliminar pago?')) return;
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
          <p className="font-medium text-brand-dark truncate">
            {inscripcion.nombre_esposo} {inscripcion.apellido_esposo} & {inscripcion.nombre_esposa} {inscripcion.apellido_esposa}
          </p>
          <p className="text-sm text-brand-brown">
            Estado: {inscripcion.estado_relacion} · {inscripcion.entrevista_realizada ? 'Entrevistados' : 'Sin entrevista'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {inscripcion.en_espera ? (
            <Badge className="bg-yellow-100 text-yellow-800">En espera</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">Inscripto</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => onToggleEspera(inscripcion.en_espera)}>
            {inscripcion.en_espera ? 'Confirmar' : 'Espera'}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
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
                onClick={() => handleEliminarPago(pago.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
