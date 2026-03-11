import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CONFIGURACION_ID, type MisionerosImagenVisualizacion } from '@/lib/constants/configuracion';
import type { Database } from '@/types/supabase';

const QUERY_KEYS = {
  configuracion: ['configuracion'] as const,
};

type ConfiguracionRow = Database['public']['Tables']['configuraciones']['Row'];

export const useConfiguracion = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.configuracion,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuraciones')
        .select('*')
        .eq('id', CONFIGURACION_ID)
        .maybeSingle();

      if (error) throw error;
      return data as ConfiguracionRow | null;
    },
  });
};

type UpdateConfiguracionInput = {
  misioneros_imagen_visualizacion: MisionerosImagenVisualizacion;
};

export const useUpdateConfiguracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ misioneros_imagen_visualizacion }: UpdateConfiguracionInput) => {
      const { error } = await supabase
        .from('configuraciones')
        .upsert({
          id: CONFIGURACION_ID,
          misioneros_imagen_visualizacion,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configuracion });
    },
  });
};
