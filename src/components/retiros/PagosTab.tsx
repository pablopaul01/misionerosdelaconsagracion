'use client';

import { useState } from 'react';
import { usePagosRetiro, useCreatePago, useDeletePago, useEstadisticasRetiro } from '@/lib/queries/retiros';
import { METODO_PAGO_LABEL } from '@/lib/constants/retiros';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import type { Database } from '@/types/supabase';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];
type MetodoPago = Database['public']['Enums']['metodo_pago'];

interface PagosTabProps {
  retiroId: string;
  tipo: TipoRetiro;
}

export function PagosTab({ retiroId, tipo }: PagosTabProps) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [inscripcionId, setInscripcionId] = useState('');

  const { data: pagos = [], isLoading } = usePagosRetiro(retiroId);
  const { data: stats } = useEstadisticasRetiro(retiroId, tipo);
  const createPago = useCreatePago(retiroId);
  const deletePago = useDeletePago(retiroId);

  const handleCreate = async () => {
    if (!monto || !inscripcionId) return;
    try {
      await createPago.mutateAsync({
        tipoInscripcion: tipo,
        inscripcionId,
        input: {
          monto: Number(monto),
          metodo,
          fecha: new Date().toISOString().split('T')[0],
          notas: '',
        },
      });
      setOpen(false);
      setMonto('');
      setMetodo('efectivo');
      setInscripcionId('');
      toast.success('Pago registrado');
    } catch {
      toast.error('Error al registrar pago');
    }
  };

  const handleDelete = async (id: string, inscripcionId: string) => {
    if (!confirm('¿Eliminar pago?')) return;
    try {
      await deletePago.mutateAsync({ id, tipoInscripcion: tipo, inscripcionId });
      toast.success('Pago eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-brand-brown">
          <DollarSign className="w-5 h-5" />
          <span className="font-medium">Total recaudado: ${(stats?.totalRecaudado ?? 0).toLocaleString('es-AR')}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              Registrar pago
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>ID de inscripción</Label>
                <Input value={inscripcionId} onChange={(e) => setInscripcionId(e.target.value)} placeholder="UUID de la inscripción" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Monto ($)</Label>
                <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Método</Label>
                <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METODO_PAGO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!monto || !inscripcionId}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-brand-brown">Cargando...</p>
        ) : pagos.length === 0 ? (
          <p className="p-4 text-brand-brown">No hay pagos registrados</p>
        ) : (
          <div className="divide-y divide-brand-brown/10">
            {pagos.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-brand-dark">${Number(p.monto).toLocaleString('es-AR')}</p>
                  <p className="text-sm text-brand-brown">
                    {METODO_PAGO_LABEL[p.metodo]} · {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(p.id, p.inscripcion_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
