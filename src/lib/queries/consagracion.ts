import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CALENDARIO_ORIGEN } from '@/lib/constants/calendario';
import {
  desactivarActividadSincronizada,
  upsertActividadSincronizada,
} from '@/lib/queries/calendario-sync';
import type {
  InscripcionConsagracionInput,
  ContactoConsagracionInput,
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
  papas:          (formacionId: string) => ['papas-consagracion', formacionId] as const,
};

// --- Formaciones ---

export const useFormacionesConsagracion = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.formaciones,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formaciones_consagracion')
        .select('*, papas_consagracion(*, misioneros(*))')
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

      await upsertActividadSincronizada(supabase, {
        origenTipo: CALENDARIO_ORIGEN.CONSAGRACION_FORMACION,
        origenId: data.id,
        origenUpdatedAt: data.created_at ?? new Date().toISOString(),
        titulo: `Consagracion ${data.anio}`,
        descripcion: 'Inicio de formacion de consagracion.',
        tipo: 'consagracion',
        fechaInicio: data.fecha_inicio,
      });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.formaciones }),
  });
};

export const useUpdateFormacionConsagracion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, anio, fecha_inicio }: { id: string; anio: number; fecha_inicio: string }) => {
      const { data, error } = await supabase
        .from('formaciones_consagracion')
        .update({ anio, fecha_inicio })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await upsertActividadSincronizada(supabase, {
        origenTipo: CALENDARIO_ORIGEN.CONSAGRACION_FORMACION,
        origenId: data.id,
        origenUpdatedAt: new Date().toISOString(),
        titulo: `Consagracion ${data.anio}`,
        descripcion: 'Inicio de formacion de consagracion.',
        tipo: 'consagracion',
        fechaInicio: data.fecha_inicio,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.formaciones });
      queryClient.invalidateQueries({ queryKey: ['formacion-consagracion'] });
    },
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
        .select('*, disertante:misioneros!disertante_id(*)')
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
    mutationFn: async ({ id, numero, tipo, fecha, disertante_id }: {
      id: string;
      numero?: number;
      tipo?: 'leccion' | 'retiro';
      fecha?: string;
      disertante_id?: string | null;
    }) => {
      const updateData: {
        numero?: number;
        tipo?: 'leccion' | 'retiro';
        fecha?: string | null;
        disertante_id?: string | null;
      } = {};
      if (numero !== undefined) updateData.numero = numero;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (fecha !== undefined) updateData.fecha = fecha || null;
      if (disertante_id !== undefined) updateData.disertante_id = disertante_id || null;
      const { data, error } = await supabase
        .from('lecciones_consagracion')
        .update(updateData)
        .eq('id', id)
        .select('id, numero, tipo, fecha, created_at')
        .single();
      if (error) throw error;

      if (data.tipo === 'retiro' && data.fecha) {
        await upsertActividadSincronizada(supabase, {
          origenTipo: CALENDARIO_ORIGEN.CONSAGRACION_RETIRO,
          origenId: data.id,
          origenUpdatedAt: new Date().toISOString(),
          titulo: `Retiro de consagracion #${data.numero}`,
          descripcion: 'Retiro dentro de la formacion de consagracion.',
          tipo: 'retiro',
          fechaInicio: data.fecha,
        });
      } else {
        await desactivarActividadSincronizada(
          supabase,
          CALENDARIO_ORIGEN.CONSAGRACION_RETIRO,
          data.id,
        );
      }
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
        .insert({
          ...input,
          fecha: input.fecha || null,
          disertante_id: input.disertante_id || null,
          formacion_id: formacionId,
        })
        .select()
        .single();
      if (error) throw error;

      if (data.tipo === 'retiro' && data.fecha) {
        await upsertActividadSincronizada(supabase, {
          origenTipo: CALENDARIO_ORIGEN.CONSAGRACION_RETIRO,
          origenId: data.id,
          origenUpdatedAt: data.created_at ?? new Date().toISOString(),
          titulo: `Retiro de consagracion #${data.numero}`,
          descripcion: 'Retiro dentro de la formacion de consagracion.',
          tipo: 'retiro',
          fechaInicio: data.fecha,
        });
      }

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
    mutationFn: async (input: InscripcionConsagracionInput | ContactoConsagracionInput) => {
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
    mutationFn: async ({ id, input }: { id: string; input: InscripcionConsagracionInput | ContactoConsagracionInput }) => {
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

// --- Marcar consagración individual ---

export const useMarcarConsagracion = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, se_consagro }: { id: string; se_consagro: boolean | null }) => {
      const { error } = await supabase
        .from('inscripciones_consagracion')
        .update({ se_consagro })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripciones(formacionId) }),
  });
};

// --- Finalizar formación ---

export const useFinalizarFormacion = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fechaConsagracion }: { id: string; fechaConsagracion: string }) => {
      const { error } = await supabase
        .from('formaciones_consagracion')
        .update({ finalizada: true, fecha_consagracion: fechaConsagracion })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.formaciones });
      queryClient.invalidateQueries({ queryKey: ['formacion-consagracion'] });
    },
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
      activo,
      fechaConsagracion,
    }: {
      nombre: string;
      apellido: string;
      dni: string;
      whatsapp: string;
      activo: boolean;
      fechaConsagracion?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('misioneros')
        .insert({
          nombre,
          apellido,
          dni,
          whatsapp,
          activo,
          fecha_consagracion: fechaConsagracion || null,
        })
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
      asistio: boolean | null; // null = eliminar el registro
      asistenciaId?: string;
    }) => {
      if (asistio === null && asistenciaId) {
        // Eliminar registro para volver a "sin marcar"
        const { error } = await supabase
          .from('asistencias_consagracion')
          .delete()
          .eq('id', asistenciaId);
        if (error) throw error;
      } else if (asistenciaId && asistio !== null) {
        // Actualizar existente
        const { error } = await supabase
          .from('asistencias_consagracion')
          .update({ asistio })
          .eq('id', asistenciaId);
        if (error) throw error;
      } else if (asistio !== null) {
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

// --- Papás de consagración ---

export const usePapasConsagracion = (formacionId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.papas(formacionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('papas_consagracion')
        .select('*, misioneros(*)')
        .eq('formacion_id', formacionId);
      if (error) throw error;
      return data;
    },
    enabled: !!formacionId,
  });
};

export const useTogglePapa = (formacionId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ misioneroId, isAdding }: { misioneroId: string; isAdding: boolean }) => {
      if (isAdding) {
        const { error } = await supabase
          .from('papas_consagracion')
          .insert({ formacion_id: formacionId, misionero_id: misioneroId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('papas_consagracion')
          .delete()
          .eq('formacion_id', formacionId)
          .eq('misionero_id', misioneroId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.papas(formacionId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.formaciones });
    },
  });
};
