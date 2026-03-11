'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConfiguracion, useUpdateConfiguracion } from '@/lib/queries/configuracion';
import {
  DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION,
  MISIONEROS_IMAGEN_VISUALIZACION,
  type MisionerosImagenVisualizacion,
} from '@/lib/constants/configuracion';
import { toast } from 'sonner';

export default function ConfiguracionesPage() {
  const { data: configuracion, isLoading } = useConfiguracion();
  const updateConfiguracion = useUpdateConfiguracion();
  const [visualizacion, setVisualizacion] = useState<MisionerosImagenVisualizacion>(
    DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION,
  );

  useEffect(() => {
    if (!configuracion?.misioneros_imagen_visualizacion) return;
    setVisualizacion(configuracion.misioneros_imagen_visualizacion);
  }, [configuracion?.misioneros_imagen_visualizacion]);

  const opcionesVisualizacion = [
    {
      value: MISIONEROS_IMAGEN_VISUALIZACION.avatarGrande,
      label: 'Avatar grande',
      description: 'Muestra la foto como avatar destacado junto al nombre.',
    },
    {
      value: MISIONEROS_IMAGEN_VISUALIZACION.bannerReal,
      label: 'Banner real',
      description: 'Muestra la imagen como banner horizontal en la tarjeta.',
    },
  ] as const;

  const currentOption = opcionesVisualizacion.find((opt) => opt.value === visualizacion)
    ?? opcionesVisualizacion[0];

  const handleSave = async () => {
    try {
      await updateConfiguracion.mutateAsync({
        misioneros_imagen_visualizacion: visualizacion,
      });
      toast.success('Configuraciones actualizadas');
    } catch {
      toast.error('No se pudo guardar la configuración');
    }
  };

  const currentValue = configuracion?.misioneros_imagen_visualizacion ?? DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION;
  const hasChanges = visualizacion !== currentValue;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-2xl text-brand-dark">Configuraciones</h1>
        <p className="text-sm text-brand-brown">
          Ajustes generales del sistema.
        </p>
      </div>

      <div className="bg-white border border-brand-creamLight rounded-xl p-5 space-y-4 max-w-xl">
        <div className="space-y-1">
          <Label htmlFor="misioneros-visualizacion">Visualización de imagen de perfil</Label>
          <p className="text-xs text-brand-brown">
            Define cómo se muestra la foto de perfil en las tarjetas de misioneros.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Select
            value={visualizacion}
            onValueChange={(value) => setVisualizacion(value as MisionerosImagenVisualizacion)}
            disabled={isLoading}
          >
            <SelectTrigger id="misioneros-visualizacion">
              <SelectValue placeholder="Seleccionar opción" />
            </SelectTrigger>
            <SelectContent>
              {opcionesVisualizacion.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-brand-brown">
            {currentOption.label}. {currentOption.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isLoading || updateConfiguracion.isPending || !hasChanges}
            className="bg-brand-brown hover:bg-brand-dark text-white"
          >
            {updateConfiguracion.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {isLoading && <span className="text-xs text-brand-brown">Cargando configuración...</span>}
        </div>
      </div>
    </div>
  );
}
