import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  InscripcionConsagracionInput,
  FormacionConsagracionInput,
  LeccionConsagracionInput,
} from '@/lib/validations/consagracion';

const MISIONEROS_QUERY_KEY = ['misioneros'] as const;

const QUERY_KEYS = {
  formaciones:    ['formaciones-consagracion'] as const,
  formacion:      (anio: number) => ['formacion-consagracion', anio] as const,
  lecciones:      (formacionId: string) => ['lecciones-consagracion', formacionId] as const,
  inscripciones:  (formacionId: string) => ['inscripciones-consagracion', formacionId] as const,
  asistencias:    (formacionId: string) => ['asistencias-consagracion', formacionId] as const,
};

// --- Formaciones ---

export const useFormacionesConsagracion = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.formaciones,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formaciones_consagracion')
        .select('*')
        .order('anio', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useFormacionConsagracion = (anio: number) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.formacion(anio),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formaciones_consagracion')
        .select('*')
        .eq('anio', anio)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!anio,
  });
};

export const useCreateFormacionConsagracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FormacionConsagracionInput) => {
      const { data, error } = await supabase
        .from('formaciones_consagracion')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.formaciones }),
  });
};

// --- Lecciones ---

export const useLeccionesConsagracion = (formacionId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.lecciones(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecciones_consagracion')
        .select('*')
        .eq('formacion_id', formacionId)
        .order('numero');
      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useUpdateLeccion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fecha }: { id: string; fecha: string }) => {
      const { error } = await supabase
        .from('lecciones_consagracion')
        .update({ fecha: fecha || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lecciones(formacionId) }),
  });
};

export const useDeleteLeccion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leccionId: string) => {
      const { count } = await supabase
        .from('asistencias_consagracion')
        .select('id', { count: 'exact', head: true })
        .eq('leccion_id', leccionId);
      if (count && count > 0) throw new Error('No se puede eliminar: tiene asistencias registradas');
      const { error } = await supabase.from('lecciones_consagracion').delete().eq('id', leccionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lecciones(formacionId) }),
  });
};

export const useAddLeccion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeccionConsagracionInput) => {
      const { data, error } = await supabase
        .from('lecciones_consagracion')
        .insert({ ...input, fecha: input.fecha || null, formacion_id: formacionId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lecciones(formacionId) }),
  });
};

// --- Inscripciones ---

export const useInscripcionesConsagracion = (formacionId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.inscripciones(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscripciones_consagracion')
        .select('*')
        .eq('formacion_id', formacionId)
        .order('apellido');
      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useCreateInscripcionConsagracion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InscripcionConsagracionInput) => {
      const { data, error } = await supabase
        .from('inscripciones_consagracion')
        .insert({ ...input, formacion_id: formacionId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripciones(formacionId) }),
  });
};

export const useUpdateInscripcionConsagracion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<InscripcionConsagracionInput> }) => {
      const { error } = await supabase
        .from('inscripciones_consagracion')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripciones(formacionId) }),
  });
};

export const useDeleteInscripcionConsagracion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inscripciones_consagracion')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripciones(formacionId) }),
  });
};

// --- Convertir inscripto a misionero ---

export const useConvertirAMisionero = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nombre,
      apellido,
      dni,
      whatsapp,
    }: {
      nombre: string;
      apellido: string;
      dni: string;
      whatsapp: string;
    }) => {
      const { data, error } = await supabase
        .from('misioneros')
        .insert({ nombre, apellido, dni, whatsapp })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MISIONEROS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripciones(formacionId) });
    },
  });
};

// --- Asistencias consagración ---

export const useAsistenciasConsagracion = (formacionId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.asistencias(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asistencias_consagracion')
        .select('id, leccion_id, inscripcion_id, asistio')
        .in(
          'leccion_id',
          await supabase
            .from('lecciones_consagracion')
            .select('id')
            .eq('formacion_id', formacionId)
            .then(({ data }) => (data ?? []).map((l) => l.id)),
        );
      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useToggleAsistenciaConsagracion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leccionId,
      inscripcionId,
      asistio,
      asistenciaId,
    }: {
      leccionId: string;
      inscripcionId: string;
      asistio: boolean;
      asistenciaId?: string;
    }) => {
      if (asistenciaId) {
        // Actualizar existente
        const { error } = await supabase
          .from('asistencias_consagracion')
          .update({ asistio })
          .eq('id', asistenciaId);
        if (error) throw error;
      } else {
        // Crear nueva
        const { error } = await supabase
          .from('asistencias_consagracion')
          .insert({ leccion_id: leccionId, inscripcion_id: inscripcionId, asistio });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asistencias(formacionId) }),
  });
};
