import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const QUERY_KEYS = {
  grupos: ['grupos-oracion'] as const,
  grupo: (id: string) => ['grupo-oracion', id] as const,
  asistencias: (grupoId: string) => ['asistencias-grupo-oracion', grupoId] as const,
  asistenciasCounts: (ids: string[]) => ['asistencias-grupo-oracion-counts', ids] as const,
};

export const useGruposOracion = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.grupos,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos_oracion')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useGrupoOracion = (id: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.grupo(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos_oracion')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCrearGrupoOracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fecha: string;
      predicaMenorMisioneroId?: string | null;
      predicaMenorSanto?: string | null;
      predicaMayorMisioneroId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('grupos_oracion')
        .insert({
          fecha: input.fecha,
          activa: false,
          predica_menor_misionero_id: input.predicaMenorMisioneroId ?? null,
          predica_menor_santo: input.predicaMenorSanto ?? null,
          predica_mayor_misionero_id: input.predicaMayorMisioneroId ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos }),
  });
};

export const useActivarGrupoOracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (grupoId: string) => {
      const { error: desactivarError } = await supabase
        .from('grupos_oracion')
        .update({ activa: false })
        .neq('id', grupoId);
      if (desactivarError) throw desactivarError;

      const { error } = await supabase
        .from('grupos_oracion')
        .update({ activa: true })
        .eq('id', grupoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos }),
  });
};

export const useDesactivarGrupoOracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (grupoId: string) => {
      const { error } = await supabase
        .from('grupos_oracion')
        .update({ activa: false })
        .eq('id', grupoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos }),
  });
};

export const useUpdateGrupoOracion = (id: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      predicaMenorMisioneroId?: string | null;
      predicaMenorSanto?: string | null;
      predicaMayorMisioneroId?: string | null;
    }) => {
      const { error } = await supabase
        .from('grupos_oracion')
        .update({
          predica_menor_misionero_id: input.predicaMenorMisioneroId ?? null,
          predica_menor_santo: input.predicaMenorSanto ?? null,
          predica_mayor_misionero_id: input.predicaMayorMisioneroId ?? null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupo(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos });
    },
  });
};

export const useUpdateGrupoOracionFecha = (id: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fecha: string) => {
      const { error } = await supabase
        .from('grupos_oracion')
        .update({ fecha })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupo(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos });
    },
  });
};

export const useDeleteGrupoOracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grupos_oracion')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.grupos }),
  });
};

export const useAsistenciasGrupoOracion = (grupoId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.asistencias(grupoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asistencias_grupo_oracion')
        .select('*, misioneros(id, nombre, apellido, dni)')
        .eq('grupo_id', grupoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!grupoId,
  });
};

export const useAsistenciasGrupoOracionCounts = (grupoIds: string[]) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.asistenciasCounts(grupoIds),
    queryFn: async () => {
      if (grupoIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('asistencias_grupo_oracion')
        .select('grupo_id')
        .in('grupo_id', grupoIds);
      if (error) throw error;
      return (data ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row.grupo_id] = (acc[row.grupo_id] ?? 0) + 1;
        return acc;
      }, {});
    },
    enabled: grupoIds.length > 0,
  });
};

export const useCrearAsistenciaGrupoOracion = (grupoId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (misioneroId: string) => {
      const { error } = await supabase
        .from('asistencias_grupo_oracion')
        .insert({ grupo_id: grupoId, misionero_id: misioneroId, asistio: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asistencias(grupoId) }),
  });
};

export const useEliminarAsistenciaGrupoOracion = (grupoId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('asistencias_grupo_oracion')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asistencias(grupoId) }),
  });
};
