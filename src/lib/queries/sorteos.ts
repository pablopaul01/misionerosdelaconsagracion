import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  SorteoAsignacionInput,
  SorteoInput,
  SorteoPagoInput,
  SorteoParticipanteInput,
} from '@/lib/validations/sorteos';
import type { Database, Json } from '@/types/supabase';

export const SORTEOS_QUERY_KEYS = {
  sorteos: ['sorteos'] as const,
  sorteo: (id: string) => ['sorteo', id] as const,
  participantes: (sorteoId: string) => ['sorteo-participantes', sorteoId] as const,
  numeros: (sorteoId: string) => ['sorteo-numeros', sorteoId] as const,
  pagos: (sorteoId: string) => ['sorteo-pagos', sorteoId] as const,
  ganadores: (sorteoId: string) => ['sorteo-ganadores', sorteoId] as const,
};

type SorteoInsert = Database['public']['Tables']['sorteos']['Insert'];

const invalidateSorteoDetail = async (queryClient: ReturnType<typeof useQueryClient>, sorteoId: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.sorteo(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.participantes(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.numeros(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.pagos(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.ganadores(sorteoId) }),
  ]);
};

export const useSorteos = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.sorteos,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useSorteo = (id: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.sorteo(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateSorteo = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SorteoInput) => {
      const payload: SorteoInsert = {
        ...input,
        descripcion: input.descripcion || null,
      };
      const { data, error } = await supabase.from('sorteos').insert(payload).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.sorteos }),
  });
};

export const useSorteoParticipantes = (sorteoId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.participantes(sorteoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteo_participantes')
        .select('*')
        .eq('sorteo_id', sorteoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sorteoId,
  });
};

export const useSorteoNumeros = (sorteoId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.numeros(sorteoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteo_numeros')
        .select('*, sorteo_participantes(nombre)')
        .eq('sorteo_id', sorteoId)
        .order('numero', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sorteoId,
  });
};

export const useSorteoPagos = (sorteoId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.pagos(sorteoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteo_pagos')
        .select('*, sorteo_pago_metodos(*), sorteo_pago_numeros(sorteo_numeros(numero))')
        .eq('sorteo_id', sorteoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sorteoId,
  });
};

export const useSorteoGanadores = (sorteoId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.ganadores(sorteoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorteo_ganadores')
        .select('*, sorteo_numeros(numero), sorteo_participantes(nombre)')
        .eq('sorteo_id', sorteoId)
        .order('premio_orden', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sorteoId,
  });
};

export const useAgregarParticipanteSorteo = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SorteoParticipanteInput) => {
      const { data, error } = await supabase.rpc('agregar_participante_sorteo', {
        p_sorteo_id: input.sorteo_id,
        p_registro_tipo: input.registro_tipo,
        p_registro_id: input.registro_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, input) => invalidateSorteoDetail(queryClient, input.sorteo_id),
  });
};

export const useAsignarNumerosSorteo = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SorteoAsignacionInput) => {
      const { data, error } = await supabase.rpc('asignar_numeros_sorteo', {
        p_sorteo_id: input.sorteo_id,
        p_participante_id: input.participante_id,
        p_cantidad: input.cantidad,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, input) => invalidateSorteoDetail(queryClient, input.sorteo_id),
  });
};

export const useRegistrarPagoSorteo = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SorteoPagoInput) => {
      const metodos: Json = input.metodos.map(({ metodo, monto }) => ({ metodo, monto }));
      const { data, error } = await supabase.rpc('registrar_pago_sorteo', {
        p_sorteo_id: input.sorteo_id,
        p_numeros: input.numeros,
        p_metodos: metodos,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, input) => invalidateSorteoDetail(queryClient, input.sorteo_id),
  });
};

export const useSortearGanadoresSorteo = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sorteoId: string) => {
      const { data, error } = await supabase.rpc('sortear_ganadores_sorteo', {
        p_sorteo_id: sorteoId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, sorteoId) => invalidateSorteoDetail(queryClient, sorteoId),
  });
};
