'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRetiros, useCreateRetiro, useDeleteRetiro, useUploadImagenRetiro } from '@/lib/queries/retiros';
import { TIPO_RETIRO_LABEL, TIPO_RETIRO } from '@/lib/constants/retiros';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageCropperDialog } from '@/components/retiros/ImageCropperDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { Calendar, MapPin, DollarSign, Users, Copy, Check, Trash2, Upload, X, MoreVertical, Pencil } from 'lucide-react';
import type { RetiroInput } from '@/lib/validations/retiros';

import type { Database } from '@/types/supabase';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];

type Retiro = {
  id: string;
  tipo: TipoRetiro;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  costo: number | null;
  cupo: number | null;
  activo: boolean | null;
};

const NuevoRetiroForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { mutateAsync: create, isPending } = useCreateRetiro();
  const uploadImagen = useUploadImagenRetiro();
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawFile(file);
      setCropOpen(true);
    }
  };

  const clearImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    setRawFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const form = useForm({
    defaultValues: {
      tipo: 'conversion' as TipoRetiro,
      nombre: '',
      descripcion: '',
      imagen_url: '',
      fecha_inicio: '',
      fecha_fin: '',
      lugar: '',
      costo: 0,
      activo: true,
    } as RetiroInput,
    onSubmit: async ({ value }) => {
      try {
        let imagenUrl = value.imagen_url;
        
        if (imagenFile) {
          imagenUrl = await uploadImagen.mutateAsync({ file: imagenFile });
        }

        await create({ ...value, imagen_url: imagenUrl });
        onSuccess();
      } catch {
        toast.error('Error al crear retiro');
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="tipo">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de retiro</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as RetiroInput['tipo'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_RETIRO).map(([, value]) => (
                  <SelectItem key={value} value={value}>
                    {TIPO_RETIRO_LABEL[value as keyof typeof TIPO_RETIRO_LABEL]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="nombre">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Nombre público</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej: Retiro Espiritual 2025"
            />
          </div>
        )}
      </form.Field>

      <div className="flex flex-col gap-1.5">
        <Label>Imagen de encabezado</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagenChange}
          className="hidden"
        />
        {imagenPreview ? (
          <div className="relative rounded-lg overflow-hidden border border-brand-brown/20">
            <img src={imagenPreview} alt="Preview" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={clearImagen}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-20 border-dashed"
          >
            <Upload className="w-5 h-5 mr-2" />
            Subir imagen
          </Button>
        )}
        <p className="text-xs text-brand-brown/60">Esta imagen aparecerá en el formulario público de inscripción</p>
      </div>

      <ImageCropperDialog
        open={cropOpen}
        file={rawFile}
        onClose={() => setCropOpen(false)}
        onCropped={(file, previewUrl) => {
          setImagenFile(file)
          setImagenPreview(previewUrl)
        }}
      />

      <form.Field name="descripcion">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Descripción del retiro..."
              rows={3}
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="fecha_inicio">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="fecha_fin">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="lugar">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Lugar</Label>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Lugar del retiro"
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="costo">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Costo ($)</Label>
              <Input
                type="number"
                min={0}
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="cupo">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Cupo (dejar vacío si sin límite)</Label>
              <Input
                type="number"
                min={1}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isPending || isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white"
          >
            {isPending || isSubmitting ? 'Creando...' : 'Crear retiro'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};

export default function RetirosPage() {
  const [open, setOpen] = useState(false);
  const [eliminando, setEliminando] = useState<Retiro | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | TipoRetiro>('todos');
  const [anioFiltro, setAnioFiltro] = useState<'todos' | string>('todos');
  const router = useRouter();

  const { data: retiros = [], isLoading } = useRetiros();
  const { mutateAsync: deleteRetiro, isPending: eliminandoPending } = useDeleteRetiro();

  const aniosDisponibles = Array.from(
    new Set(
      retiros
        .map((r) => r.fecha_inicio?.slice(0, 4))
        .filter((year): year is string => !!year)
    )
  ).sort((a, b) => b.localeCompare(a));

  const retirosFiltrados = retiros.filter((r) => {
    const coincideTipo = tipoFiltro === 'todos' || r.tipo === tipoFiltro;
    const anio = r.fecha_inicio?.slice(0, 4) ?? '';
    const coincideAnio = anioFiltro === 'todos' || anio === anioFiltro;
    return coincideTipo && coincideAnio;
  });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-retiro-menu]')) return;
      setMenuOpenId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const copyLink = (retiroId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/retiros/${retiroId}`);
    setCopiedId(retiroId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    try {
      await deleteRetiro(eliminando.id);
      toast.success('Retiro eliminado');
      setEliminando(null);
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Error al eliminar');
      setEliminando(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Retiros</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              + Nuevo retiro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Nuevo Retiro</DialogTitle>
            </DialogHeader>
            <NuevoRetiroForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <Label>Filtrar por tipo</Label>
          <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as 'todos' | TipoRetiro)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(TIPO_RETIRO).map(([, value]) => (
                <SelectItem key={value} value={value}>
                  {TIPO_RETIRO_LABEL[value as keyof typeof TIPO_RETIRO_LABEL]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <Label>Filtrar por año</Label>
          <Select value={anioFiltro} onValueChange={setAnioFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {aniosDisponibles.map((anio: string) => (
                <SelectItem key={anio} value={anio}>{anio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-brand-brown">Cargando...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {retirosFiltrados.map((retiro) => (
          <div
            key={retiro.id}
            className="bg-white border border-brand-creamLight rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-title text-brand-dark text-lg">{retiro.nombre}</p>
                  {!retiro.activo && (
                    <Badge className="bg-red-100 text-red-700 text-xs">Inactivo</Badge>
                  )}
                </div>
                <Badge className="bg-brand-creamLight text-brand-brown text-xs mt-1">
                  {TIPO_RETIRO_LABEL[retiro.tipo]}
                </Badge>
              </div>
              <div className="relative" data-retiro-menu>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId((prev) => (prev === retiro.id ? null : retiro.id));
                  }}
                  data-retiro-menu
                  className="p-1.5 rounded-full hover:bg-brand-creamLight text-brand-brown"
                  aria-label="Acciones"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpenId === retiro.id && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-white border border-brand-creamLight rounded-lg shadow-lg z-10"
                    data-retiro-menu
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/admin/retiros/${retiro.id}?edit=true`)}
                      className="w-full px-3 py-2 text-left text-sm text-brand-brown hover:bg-brand-creamLight flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => setEliminando(retiro as Retiro)}
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {retiro.descripcion && (
              <p className="text-sm text-brand-brown/80 line-clamp-2">{retiro.descripcion}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-brand-brown">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(retiro.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}
                {retiro.fecha_fin && (
                  <> - {new Date(retiro.fecha_fin + 'T00:00:00').toLocaleDateString('es-AR')}</>
                )}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {retiro.lugar}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-brand-brown">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {(retiro.costo ?? 0) > 0 ? `$${(retiro.costo ?? 0).toLocaleString('es-AR')}` : 'Gratis'}
              </span>
              {retiro.cupo && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Cupo: {retiro.cupo}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-brand-creamLight">
              <button
                onClick={() => copyLink(retiro.id)}
                className="flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-navy transition-colors"
              >
                {copiedId === retiro.id ? (
                  <><Check className="w-4 h-4" /><span>Copiado</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copiar link</span></>
                )}
              </button>
              <button
                onClick={() => router.push(`/admin/retiros/${retiro.id}`)}
                className="text-sm text-brand-brown hover:text-brand-dark transition-colors"
              >
                Ver detalle
              </button>
            </div>
          </div>
        ))}

        {!isLoading && retirosFiltrados.length === 0 && (
          <p className="text-brand-brown col-span-2">No hay retiros creados</p>
        )}
      </div>

      <AlertDialog open={!!eliminando} onOpenChange={(v) => { if (!v) setEliminando(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar retiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el retiro <strong>{eliminando?.nombre}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminandoPending}
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
