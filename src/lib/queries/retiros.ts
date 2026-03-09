import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  RetiroInput,
  InscripcionConversionInput,
  InscripcionMatrimoniosInput,
  PagoInput,
  RolServidorInput,
  ServidorInput,
  CompraInput,
} from '@/lib/validations/retiros';
import type { TipoRetiro } from '@/lib/constants/retiros';

const QUERY_KEYS = {
  retiros: ['retiros'] as const,
  retiro: (id: string) => ['retiro', id] as const,
  retiroPublico: (id: string) => ['retiro-publico', id] as const,
  inscripcionesConversion: (retiroId: string) => ['inscripciones-conversion', retiroId] as const,
  inscripcionesMatrimonios: (retiroId: string) => ['inscripciones-matrimonios', retiroId] as const,
  inscripcionesMisioneros: (retiroId: string) => ['inscripciones-misioneros', retiroId] as const,
  pagos: (retiroId: string) => ['pagos-retiro', retiroId] as const,
  pagosByInscripcion: (tipoInscripcion: TipoRetiro, inscripcionId: string) =>
    ['pagos-inscripcion', tipoInscripcion, inscripcionId] as const,
  rolesServidor: ['roles-servidor-retiro'] as const,
  servidores: (retiroId: string) => ['servidores-retiro', retiroId] as const,
  compras: (retiroId: string) => ['compras-retiro', retiroId] as const,
  misioneros: ['misioneros-all'] as const,
};

// ============ MISIONEROS (listado general) ============

export const useMisioneros = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.misioneros,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('misioneros')
        .select('*')
        .order('apellido');
      if (error) throw error;
      return data;
    },
  });
};

// ============ RETIROS ============

export const useRetiros = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.retiros,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiros')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useRetiro = (id: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.retiro(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiros')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useRetiroPublico = (id: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.retiroPublico(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiros')
        .select('*')
        .eq('id', id)
        .eq('activo', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useRetirosPublicos = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: [...QUERY_KEYS.retiros, 'publicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retiros')
        .select('*')
        .eq('activo', true)
        .gte('fecha_fin', new Date().toISOString().split('T')[0])
        .order('fecha_inicio', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateRetiro = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RetiroInput) => {
      const { data, error } = await supabase
        .from('retiros')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.retiros }),
  });
};

export const useUpdateRetiro = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<RetiroInput> }) => {
      const { data, error } = await supabase
        .from('retiros')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.retiros });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.retiro(id) });
    },
  });
};

export const useDeleteRetiro = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('retiros').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.retiros }),
  });
};

// ============ INSCRIPCIONES CONVERSIÓN ============

export const useInscripcionesConversion = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.inscripcionesConversion(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_conversion')
        .select('*')
        .eq('retiro_id', retiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const useCreateInscripcionConversion = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InscripcionConversionInput) => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_conversion')
        .insert({ ...input, retiro_id: retiroId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesConversion(retiroId) }),
  });
};

export const useUpdateInscripcionConversion = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<InscripcionConversionInput> }) => {
      const { error } = await supabase
        .from('inscripciones_retiro_conversion')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesConversion(retiroId) }),
  });
};

export const useDeleteInscripcionConversion = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inscripciones_retiro_conversion')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesConversion(retiroId) }),
  });
};

// ============ INSCRIPCIONES MATRIMONIOS ============

export const useInscripcionesMatrimonios = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.inscripcionesMatrimonios(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_matrimonios')
        .select('*')
        .eq('retiro_id', retiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const useCreateInscripcionMatrimonios = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InscripcionMatrimoniosInput) => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_matrimonios')
        .insert({ ...input, retiro_id: retiroId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMatrimonios(retiroId) }),
  });
};

export const useUpdateInscripcionMatrimonios = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<InscripcionMatrimoniosInput & { entrevista_realizada?: boolean; entrevista_fecha?: string; entrevista_notas?: string }> }) => {
      const { error } = await supabase
        .from('inscripciones_retiro_matrimonios')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMatrimonios(retiroId) }),
  });
};

export const useDeleteInscripcionMatrimonios = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inscripciones_retiro_matrimonios')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMatrimonios(retiroId) }),
  });
};

// ============ INSCRIPCIONES MISIONEROS ============

export const useInscripcionesMisioneros = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.inscripcionesMisioneros(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_misioneros')
        .select('*, misioneros(*)')
        .eq('retiro_id', retiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const useCreateInscripcionMisionero = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (misioneroId: string) => {
      const { data, error } = await supabase
        .from('inscripciones_retiro_misioneros')
        .insert({ retiro_id: retiroId, misionero_id: misioneroId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMisioneros(retiroId) }),
  });
};

export const useLookupMisioneroPorDni = () => {
  const supabase = createClient();
  return useMutation({
    mutationFn: async (dni: string) => {
      const { data, error } = await supabase
        .from('misioneros')
        .select('*')
        .eq('dni', dni)
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteInscripcionMisionero = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inscripciones_retiro_misioneros')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMisioneros(retiroId) }),
  });
};

// ============ CAMBIAR ESTADO ESPERA ============

export const useCambiarEstadoEsperaConversion = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, en_espera }: { id: string; en_espera: boolean }) => {
      const { error } = await supabase
        .from('inscripciones_retiro_conversion')
        .update({ en_espera })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesConversion(retiroId) }),
  });
};

export const useCambiarEstadoEsperaMatrimonios = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, en_espera }: { id: string; en_espera: boolean }) => {
      const { error } = await supabase
        .from('inscripciones_retiro_matrimonios')
        .update({ en_espera })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inscripcionesMatrimonios(retiroId) }),
  });
};

// ============ PAGOS ============

export const usePagosRetiro = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.pagos(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_retiro')
        .select('*')
        .eq('retiro_id', retiroId)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const usePagosByInscripcion = (tipoInscripcion: TipoRetiro, inscripcionId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.pagosByInscripcion(tipoInscripcion, inscripcionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_retiro')
        .select('*')
        .eq('tipo_inscripcion', tipoInscripcion)
        .eq('inscripcion_id', inscripcionId)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!inscripcionId,
  });
};

export const useCreatePago = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tipoInscripcion,
      inscripcionId,
      input,
    }: {
      tipoInscripcion: TipoRetiro;
      inscripcionId: string;
      input: PagoInput;
    }) => {
      const { data, error } = await supabase
        .from('pagos_retiro')
        .insert({
          retiro_id: retiroId,
          tipo_inscripcion: tipoInscripcion,
          inscripcion_id: inscripcionId,
          ...input,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { tipoInscripcion, inscripcionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pagos(retiroId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pagosByInscripcion(tipoInscripcion, inscripcionId) });
    },
  });
};

export const useDeletePago = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tipoInscripcion, inscripcionId }: { id: string; tipoInscripcion: TipoRetiro; inscripcionId: string }) => {
      const { error } = await supabase.from('pagos_retiro').delete().eq('id', id);
      if (error) throw error;
      return { tipoInscripcion, inscripcionId };
    },
    onSuccess: (_, { tipoInscripcion, inscripcionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pagos(retiroId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pagosByInscripcion(tipoInscripcion, inscripcionId) });
    },
  });
};

// ============ ROLES DE SERVIDOR ============

export const useRolesServidor = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.rolesServidor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles_servidor_retiro')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
};

export const useRolesServidorActivos = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: [...QUERY_KEYS.rolesServidor, 'activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles_servidor_retiro')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateRolServidor = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RolServidorInput) => {
      const { data, error } = await supabase
        .from('roles_servidor_retiro')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesServidor }),
  });
};

export const useUpdateRolServidor = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<RolServidorInput> }) => {
      const { error } = await supabase
        .from('roles_servidor_retiro')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesServidor }),
  });
};

export const useDeleteRolServidor = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roles_servidor_retiro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesServidor }),
  });
};

// ============ SERVIDORES ============

export const useServidoresRetiro = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.servidores(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servidores_retiro')
        .select('*, misioneros(*), roles_servidor_retiro(*)')
        .eq('retiro_id', retiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const useAddServidor = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServidorInput) => {
      const { data, error } = await supabase
        .from('servidores_retiro')
        .insert({ ...input, retiro_id: retiroId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servidores(retiroId) });
    },
  });
};

export const useUpdateServidor = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ServidorInput> }) => {
      const { error } = await supabase
        .from('servidores_retiro')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servidores(retiroId) }),
  });
};

export const useRemoveServidor = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('servidores_retiro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servidores(retiroId) }),
  });
};

// ============ COMPRAS ============

export const useComprasRetiro = (retiroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.compras(retiroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_retiro')
        .select('*')
        .eq('retiro_id', retiroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!retiroId,
  });
};

export const useCreateCompra = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompraInput) => {
      const { data, error } = await supabase
        .from('compras_retiro')
        .insert({ ...input, retiro_id: retiroId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compras(retiroId) }),
  });
};

export const useUpdateCompra = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CompraInput> }) => {
      const { error } = await supabase
        .from('compras_retiro')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compras(retiroId) }),
  });
};

export const useToggleComprado = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comprado }: { id: string; comprado: boolean }) => {
      const { error } = await supabase
        .from('compras_retiro')
        .update({ comprado })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compras(retiroId) }),
  });
};

export const useDeleteCompra = (retiroId: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('compras_retiro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.compras(retiroId) }),
  });
};

// ============ UPLOAD IMAGEN ============

export const useUploadImagenRetiro = () => {
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ file, retiroId }: { file: File; retiroId?: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${retiroId ?? crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      const filePath = `imagenes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retiros')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('retiros')
        .getPublicUrl(filePath);

      return publicUrl;
    },
  });
};

// ============ ESTADÍSTICAS ============

export const useEstadisticasRetiro = (retiroId: string, tipo: TipoRetiro) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['estadisticas-retiro', retiroId, tipo],
    queryFn: async () => {
      let totalInscriptos = 0;
      let enEspera = 0;

      if (tipo === 'conversion') {
        const { data } = await supabase
          .from('inscripciones_retiro_conversion')
          .select('en_espera')
          .eq('retiro_id', retiroId);
        totalInscriptos = data?.length ?? 0;
        enEspera = data?.filter((i) => i.en_espera).length ?? 0;
      } else if (tipo === 'matrimonios') {
        const { data } = await supabase
          .from('inscripciones_retiro_matrimonios')
          .select('en_espera')
          .eq('retiro_id', retiroId);
        totalInscriptos = data?.length ?? 0;
        enEspera = data?.filter((i) => i.en_espera).length ?? 0;
      } else if (tipo === 'misioneros') {
        const { count } = await supabase
          .from('inscripciones_retiro_misioneros')
          .select('id', { count: 'exact', head: true })
          .eq('retiro_id', retiroId);
        totalInscriptos = count ?? 0;
      }

      // Sumar pagos
      const { data: pagos } = await supabase
        .from('pagos_retiro')
        .select('monto')
        .eq('retiro_id', retiroId);
      const totalRecaudado = pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;

      return {
        totalInscriptos,
        inscriptos: totalInscriptos - enEspera,
        enEspera,
        totalRecaudado,
      };
    },
    enabled: !!retiroId,
  });
};
