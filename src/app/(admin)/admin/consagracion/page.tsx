'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormacionesConsagracion, useCreateFormacionConsagracion } from '@/lib/queries/consagracion';
import { Check, Copy, CheckCircle2, Users } from 'lucide-react';
import { formacionConsagracionSchema } from '@/lib/validations/consagracion';
import { fieldError } from '@/lib/utils/form';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PapasSheet } from '@/components/consagracion/PapasSheet';

const NuevaFormacionForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutateAsync: create } = useCreateFormacionConsagracion();
  const form = useForm({
    defaultValues: { anio: new Date().getFullYear(), fecha_inicio: '' },
    validators: { onSubmit: formacionConsagracionSchema },
    onSubmit: async ({ value }) => {
      await create(value);
      onSuccess();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="flex flex-col gap-4">
      <form.Field name="anio">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Año</Label>
            <Input
              type="number"
              min={2020}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="fecha_inicio">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">{fieldError(field.state.meta.errors[0])}</span>
            )}
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting} className="bg-brand-brown hover:bg-brand-dark text-white">
            {isSubmitting ? 'Creando...' : 'Crear formación'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};

export default function ConsagracionPage() {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [papasSheetOpen, setPapasSheetOpen] = useState(false);
  const [selectedFormacionId, setSelectedFormacionId] = useState<string | null>(null);
  const router = useRouter();

  const copyLink = (anio: number, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/consagracion/inscripcion/${anio}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPapasSheet = (formacionId: string) => {
    setSelectedFormacionId(formacionId);
    setPapasSheetOpen(true);
  };

  const { data: formaciones = [], isLoading } = useFormacionesConsagracion();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Consagración Total</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              + Nueva formación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Nueva formación de Consagración</DialogTitle>
            </DialogHeader>
            <NuevaFormacionForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-brand-brown">Cargando...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formaciones.map((f) => {
          const papas = (f as typeof f & { papas_consagracion?: Array<{ misioneros: { id: string; nombre: string; apellido: string } | null }> }).papas_consagracion ?? [];
          const papasConMisionero = papas.filter((p) => p.misioneros);
          const maxVisible = 2;
          const visibles = papasConMisionero.slice(0, maxVisible);
          const restantes = papasConMisionero.length - maxVisible;

          return (
            <div key={f.id} className="bg-white border border-brand-creamLight rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-title text-brand-dark text-lg">Consagración {f.anio}</p>
                    {f.finalizada && (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Finalizada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-brown">
                    Inicio: {new Date(f.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(f.anio, f.id)}
                  title="Copiar link de inscripción"
                  className="flex items-center gap-1.5 text-xs text-brand-teal hover:text-brand-navy transition-colors shrink-0 mt-1"
                >
                  {copiedId === f.id ? (
                    <><Check className="w-4 h-4" /><span>Copiado</span></>
                  ) : (
                    <><Copy className="w-4 h-4" /><span>Link inscripción</span></>
                  )}
                </button>
              </div>

              {/* Papás de consagración */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-brand-brown">Papás:</span>
                {visibles.length === 0 ? (
                  <span className="text-xs text-brand-brown/60 italic">Sin asignar</span>
                ) : (
                  <>
                    {visibles.map((p) => (
                      <Badge key={p.misioneros!.id} className="bg-brand-creamLight text-brand-dark text-xs">
                        {p.misioneros!.apellido}, {p.misioneros!.nombre.charAt(0)}.
                      </Badge>
                    ))}
                    {restantes > 0 && (
                      <Badge className="bg-brand-brown/20 text-brand-dark text-xs">
                        +{restantes}
                      </Badge>
                    )}
                  </>
                )}
                <button
                  onClick={() => openPapasSheet(f.id)}
                  className="flex items-center gap-1 text-xs text-brand-teal hover:text-brand-navy transition-colors ml-auto"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-brand-teal border-brand-teal"
                  onClick={() => router.push(`/admin/consagracion/${f.anio}/inscripciones`)}
                >
                  Inscripciones
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-brand-brown border-brand-brown"
                  onClick={() => router.push(`/admin/consagracion/${f.anio}/asistencias`)}
                >
                  Asistencias
                </Button>
              </div>
            </div>
          );
        })}

        {!isLoading && formaciones.length === 0 && (
          <p className="text-brand-brown col-span-2">No hay formaciones de consagración creadas</p>
        )}
      </div>

      {/* Sheet para editar papás */}
      {selectedFormacionId && (
        <PapasSheet
          formacionId={selectedFormacionId}
          open={papasSheetOpen}
          onOpenChange={setPapasSheetOpen}
        />
      )}
    </div>
  );
}
