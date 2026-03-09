'use client';

import { useState } from 'react';
import {
  useComprasRetiro,
  useCreateCompra,
  useDeleteCompra,
  useToggleComprado,
} from '@/lib/queries/retiros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface ComprasTabProps {
  retiroId: string;
}

export function ComprasTab({ retiroId }: ComprasTabProps) {
  const [open, setOpen] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('');
  const [costo, setCosto] = useState('');

  const { data: compras = [], isLoading } = useComprasRetiro(retiroId);
  const createCompra = useCreateCompra(retiroId);
  const deleteCompra = useDeleteCompra(retiroId);
  const toggleComprado = useToggleComprado(retiroId);

  const handleCreate = async () => {
    if (!concepto) return;
    try {
      await createCompra.mutateAsync({
        concepto,
        cantidad: cantidad ? Number(cantidad) : null,
        unidad,
        costo: costo ? Number(costo) : null,
        comprado: false,
      });
      setOpen(false);
      setConcepto('');
      setCantidad('');
      setUnidad('');
      setCosto('');
      toast.success('Compra agregada');
    } catch {
      toast.error('Error al agregar');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleComprado.mutateAsync({ id, comprado: !current });
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar compra?')) return;
    try {
      await deleteCompra.mutateAsync(id);
      toast.success('Compra eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const totalCosto = compras.reduce((acc, c) => acc + (Number(c.costo) || 0), 0);
  const comprados = compras.filter((c) => c.comprado).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-brand-brown">
          {comprados}/{compras.length} comprados · Total: ${totalCosto.toLocaleString('es-AR')}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              Agregar item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar item de compra</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Concepto</Label>
                <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Qué comprar" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Cantidad</Label>
                  <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Unidad</Label>
                  <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="kg, u, l..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Costo estimado ($)</Label>
                <Input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="0" />
              </div>
              <Button onClick={handleCreate} disabled={!concepto}>Agregar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-brand-creamLight rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-brand-brown">Cargando...</p>
        ) : compras.length === 0 ? (
          <p className="p-4 text-brand-brown">No hay items de compra</p>
        ) : (
          <div className="divide-y divide-brand-brown/10">
            {compras.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox checked={c.comprado} onCheckedChange={() => handleToggle(c.id, c.comprado)} />
                  <div>
                    <p className={`font-medium ${c.comprado ? 'line-through text-brand-brown/50' : 'text-brand-dark'}`}>
                      {c.concepto}
                    </p>
                    <p className="text-sm text-brand-brown">
                      {c.cantidad} {c.unidad} {c.costo && `· $${Number(c.costo).toLocaleString('es-AR')}`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(c.id)}>
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
