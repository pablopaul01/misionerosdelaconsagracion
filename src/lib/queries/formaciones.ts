import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { FormacionInput, ClaseInput } from '@/lib/validations/formaciones';

const QUERY_KEYS = {
  all:        ['formaciones'] as const,
  detail:     (id: string) => ['formaciones', id] as const,
  clases:     (formacionId: string) => ['clases', formacionId] as const,
  misioneros: (formacionId: string) => ['formacion-misioneros', formacionId] as const,
};

export const useFormaciones = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formaciones_misioneros')
        .select('*')
        .order('anio', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useFormacion = (id: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formaciones_misioneros')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateFormacion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FormacionInput) => {
      const { data, error } = await supabase
        .from('formaciones_misioneros')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

export const useUpdateFormacion = (id: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fecha_inicio: string }) => {
      const { error } = await supabase
        .from('formaciones_misioneros')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

// --- Clases ---

export const useClases = (formacionId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.clases(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clases')
        .select('*')
        .eq('formacion_id', formacionId)
        .order('numero');

      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useAddClase = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClaseInput) => {
      const { data, error } = await supabase
        .from('clases')
        .insert({ ...input, formacion_id: formacionId, activa: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clases(formacionId) });
    },
  });
};

export const useUpdateClaseFecha = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claseId, fecha }: { claseId: string; fecha: string }) => {
      const { error } = await supabase
        .from('clases')
        .update({ fecha })
        .eq('id', claseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clases(formacionId) });
    },
  });
};

/** Activa una clase y desactiva el resto de la formación (vía RPC atómica) */
export const useActivarClase = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claseId: string) => {
      const { error } = await supabase.rpc('activate_clase', {
        p_clase_id:     claseId,
        p_formacion_id: formacionId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clases(formacionId) });
    },
  });
};

export const useDeleteClase = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claseId: string) => {
      // Verificar que no tenga asistencias
      const { count } = await supabase
        .from('asistencias_misioneros')
        .select('id', { count: 'exact', head: true })
        .eq('clase_id', claseId);
      if (count && count > 0) throw new Error('No se puede eliminar: tiene asistencias registradas');
      const { error } = await supabase.from('clases').delete().eq('id', claseId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clases(formacionId) }),
  });
};

/** Upsert asistencia de un misionero a una clase */
export const useToggleAsistenciaMisionero = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claseId,
      misioneroId,
      asistio,
      asistenciaId,
      motivoAusencia,
    }: {
      claseId: string;
      misioneroId: string;
      asistio: boolean;
      asistenciaId?: string;
      motivoAusencia?: string;
    }) => {
      const motivo = asistio ? null : (motivoAusencia?.trim() || null);
      if (asistenciaId) {
        const { error } = await supabase
          .from('asistencias_misioneros')
          .update({ asistio, motivo_ausencia: motivo })
          .eq('id', asistenciaId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('asistencias_misioneros')
          .insert({ clase_id: claseId, misionero_id: misioneroId, asistio, motivo_ausencia: motivo });
        if (error) throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['asistencias-formacion', formacionId] }),
  });
};

/** Desactiva todas las clases de la formación */
export const useDesactivarClases = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('clases')
        .update({ activa: false })
        .eq('formacion_id', formacionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clases(formacionId) });
    },
  });
};

// --- Inscripciones de misioneros a formaciones ---

export const useMisionerosDeFormacion = (formacionId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.misioneros(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscripciones_misioneros')
        .select('*, misioneros(*)')
        .eq('formacion_id', formacionId);

      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useInscribirMisionero = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (misioneroId: string) => {
      const { error } = await supabase
        .from('inscripciones_misioneros')
        .insert({ misionero_id: misioneroId, formacion_id: formacionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.misioneros(formacionId) });
    },
  });
};
