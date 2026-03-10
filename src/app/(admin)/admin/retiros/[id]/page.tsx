'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRetiro, useDeleteRetiro, useUpdateRetiro, useUploadImagenRetiro, useDeleteImagenRetiro } from '@/lib/queries/retiros';
import { TIPO_RETIRO_LABEL, TIPO_RETIRO } from '@/lib/constants/retiros';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Calendar, MapPin, DollarSign, Users, Trash2 } from 'lucide-react';
import { InscripcionesTab } from '@/components/retiros/InscripcionesTab';
import { ServidoresTab } from '@/components/retiros/ServidoresTab';
import { ComprasTab } from '@/components/retiros/ComprasTab';
import { ImageCropperDialog } from '@/components/retiros/ImageCropperDialog';
import { toast } from 'sonner';
import type { RetiroInput } from '@/lib/validations/retiros';
import type { Database } from '@/types/supabase';

type TipoRetiro = Database['public']['Enums']['tipo_retiro'];

export default function RetiroDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const retiroId = params.id as string;

  const { data: retiro, isLoading } = useRetiro(retiroId);
  const { mutateAsync: deleteRetiro, isPending: deleting } = useDeleteRetiro();
  const { mutateAsync: updateRetiro, isPending: updating } = useUpdateRetiro();
  const uploadImagen = useUploadImagenRetiro();
  const deleteImagen = useDeleteImagenRetiro();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editValues, setEditValues] = useState<RetiroInput>({
    tipo: 'conversion' as TipoRetiro,
    nombre: '',
    descripcion: '',
    imagen_url: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    costo: 0,
    cupo: null,
    activo: true,
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenedRef = useRef(false);

  const handleEliminar = async () => {
    const previousUrl = retiro?.imagen_url ?? '';
    await deleteRetiro(retiroId);
    if (previousUrl) {
      await deleteImagen.mutateAsync({ publicUrl: previousUrl });
    }
    router.push('/admin/retiros');
  };

  const clearEditParam = useCallback(() => {
    router.replace(`/admin/retiros/${retiroId}`);
  }, [router, retiroId]);

  const openEdit = useCallback(() => {
    if (!retiro) return;
    setEditValues({
      tipo: retiro.tipo,
      nombre: retiro.nombre ?? '',
      descripcion: retiro.descripcion ?? '',
      imagen_url: retiro.imagen_url ?? '',
      fecha_inicio: retiro.fecha_inicio ?? '',
      fecha_fin: retiro.fecha_fin ?? '',
      lugar: retiro.lugar ?? '',
      costo: retiro.costo ?? 0,
      cupo: retiro.cupo ?? null,
      activo: retiro.activo ?? true,
    });
    setImagenPreview(retiro.imagen_url ?? null);
    setImagenFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditOpen(true);
  }, [retiro]);

  useEffect(() => {
    const shouldOpen = searchParams.get('edit') === 'true';
    if (shouldOpen && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      openEdit();
    }
    if (!shouldOpen) {
      autoOpenedRef.current = false;
    }
  }, [searchParams, openEdit]);

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
    setEditValues((prev) => ({ ...prev, imagen_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const previousUrl = retiro?.imagen_url ?? '';
      let imagenUrl = editValues.imagen_url;
      if (imagenFile) {
        imagenUrl = await uploadImagen.mutateAsync({ file: imagenFile, retiroId });
      }
      await updateRetiro({ id: retiroId, input: { ...editValues, imagen_url: imagenUrl } });
      if (previousUrl && previousUrl !== imagenUrl) {
        await deleteImagen.mutateAsync({ publicUrl: previousUrl });
      }
      toast.success('Retiro actualizado');
      setEditOpen(false);
      clearEditParam();
    } catch {
      toast.error('Error al actualizar retiro');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-brand-brown">Cargando...</div>;
  }

  if (!retiro) {
    return <div className="p-6 text-brand-brown">Retiro no encontrado</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        {/* Fila 1: navegación + acciones */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push('/admin/retiros')} className="text-brand-brown -ml-3">
            ← Volver
          </Button>
          <div className="flex items-center gap-2">
            <Dialog
              open={editOpen}
              onOpenChange={(value) => {
                setEditOpen(value);
                if (!value) {
                  clearEditParam();
                  autoOpenedRef.current = false;
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openEdit}>Editar</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar retiro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo de retiro</Label>
                  <Select value={editValues.tipo} onValueChange={(v) => setEditValues((prev) => ({ ...prev, tipo: v as TipoRetiro }))}>
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

                <div className="flex flex-col gap-1.5">
                  <Label>Nombre</Label>
                  <Input value={editValues.nombre} onChange={(e) => setEditValues((prev) => ({ ...prev, nombre: e.target.value }))} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Descripción</Label>
                  <Textarea value={editValues.descripcion} onChange={(e) => setEditValues((prev) => ({ ...prev, descripcion: e.target.value }))} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Fecha inicio</Label>
                    <Input type="date" value={editValues.fecha_inicio} onChange={(e) => setEditValues((prev) => ({ ...prev, fecha_inicio: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Fecha fin</Label>
                    <Input type="date" value={editValues.fecha_fin} onChange={(e) => setEditValues((prev) => ({ ...prev, fecha_fin: e.target.value }))} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Lugar</Label>
                  <Input value={editValues.lugar} onChange={(e) => setEditValues((prev) => ({ ...prev, lugar: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Costo ($)</Label>
                    <Input type="number" min={0} value={editValues.costo} onChange={(e) => setEditValues((prev) => ({ ...prev, costo: Number(e.target.value) }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Cupo</Label>
                    <Input type="number" min={1} value={editValues.cupo ?? ''} onChange={(e) => setEditValues((prev) => ({ ...prev, cupo: e.target.value ? Number(e.target.value) : null }))} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Estado</Label>
                  <Select value={editValues.activo ? 'true' : 'false'} onValueChange={(v) => setEditValues((prev) => ({ ...prev, activo: v === 'true' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Imagen</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagenChange} className="hidden" />
                  {imagenPreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-brand-brown/20">
                      <img src={imagenPreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button type="button" onClick={clearImagen} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-20 border-dashed">
                      Subir imagen
                    </Button>
                  )}
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

                  <Button type="submit" disabled={updating} className="w-full bg-brand-brown hover:bg-brand-dark text-white">
                    {updating ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setConfirmDeleteOpen(true)} disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Fila 2: título */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-title text-xl text-brand-dark">{retiro.nombre}</h1>
          {!retiro.activo && <Badge className="bg-red-100 text-red-700">Inactivo</Badge>}
        </div>

        {/* Fila 3: metadata */}
        <div className="flex items-center gap-2 flex-wrap text-sm text-brand-brown">
          <Badge className="bg-brand-creamLight text-brand-brown">
            {TIPO_RETIRO_LABEL[retiro.tipo]}
          </Badge>
          <span>·</span>
          <span>{new Date(retiro.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}</span>
          {retiro.fecha_fin && (
            <>
              <span>·</span>
              <span>{new Date(retiro.fecha_fin + 'T00:00:00').toLocaleDateString('es-AR')}</span>
            </>
          )}
          <span>·</span>
          <span>{retiro.lugar}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-brand-creamLight rounded-xl p-4 flex flex-wrap gap-4">
        <span className="flex items-center gap-2 text-brand-brown">
          <Calendar className="w-4 h-4" />
          {new Date(retiro.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}
          {retiro.fecha_fin && <> - {new Date(retiro.fecha_fin + 'T00:00:00').toLocaleDateString('es-AR')}</>}
        </span>
        <span className="flex items-center gap-2 text-brand-brown">
          <MapPin className="w-4 h-4" />
          {retiro.lugar}
        </span>
        <span className="flex items-center gap-2 text-brand-brown">
          <DollarSign className="w-4 h-4" />
          {(retiro.costo ?? 0) > 0 ? (retiro.costo ?? 0).toLocaleString('es-AR') : 'Gratis'}
        </span>
        {retiro.cupo && (
          <span className="flex items-center gap-2 text-brand-brown">
            <Users className="w-4 h-4" />
            Cupo: {retiro.cupo}
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inscripciones" className="w-full">
        <TabsList className="bg-brand-creamLight">
          <TabsTrigger value="inscripciones" className="data-[state=active]:bg-brand-brown data-[state=active]:text-white">
            Inscripciones
          </TabsTrigger>
          <TabsTrigger value="servidores" className="data-[state=active]:bg-brand-brown data-[state=active]:text-white">
            Servidores
          </TabsTrigger>
          <TabsTrigger value="compras" className="data-[state=active]:bg-brand-brown data-[state=active]:text-white">
            Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inscripciones">
          <InscripcionesTab retiroId={retiroId} tipo={retiro.tipo} />
        </TabsContent>
        <TabsContent value="servidores">
          <ServidoresTab retiroId={retiroId} />
        </TabsContent>
        <TabsContent value="compras">
          <ComprasTab retiroId={retiroId} />
        </TabsContent>
      </Tabs>
      </div>
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar retiro?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el retiro <strong>{retiro.nombre}</strong> y sus inscripciones asociadas. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            className="bg-red-500 hover:bg-red-700 text-white"
            disabled={deleting}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
