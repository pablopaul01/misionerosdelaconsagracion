import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SORTEO_REGISTRO_TIPOS, type SorteoRegistroTipo } from '@/lib/constants/sorteos';
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
  registrosDisponiblesBase: (sorteoId: string) => ['sorteo-registros-disponibles', sorteoId] as const,
  registrosDisponibles: (sorteoId: string, registroTipo: SorteoRegistroTipo) =>
    ['sorteo-registros-disponibles', sorteoId, registroTipo] as const,
  numeros: (sorteoId: string) => ['sorteo-numeros', sorteoId] as const,
  pagos: (sorteoId: string) => ['sorteo-pagos', sorteoId] as const,
  ganadores: (sorteoId: string) => ['sorteo-ganadores', sorteoId] as const,
};

type SorteoInsert = Database['public']['Tables']['sorteos']['Insert'];
type SorteoParticipante = Database['public']['Tables']['sorteo_participantes']['Row'];
type InscripcionConversion = Database['public']['Tables']['inscripciones_retiro_conversion']['Row'];
type InscripcionMatrimonios = Database['public']['Tables']['inscripciones_retiro_matrimonios']['Row'];
type Misionero = Database['public']['Tables']['misioneros']['Row'];

export interface SorteoRegistroDisponible {
  id: string;
  label: string;
}

const buildNombreCompleto = (partes: Array<string | null | undefined>) => {
  const nombre = partes.map((parte) => parte?.trim()).filter(Boolean).join(' ');
  return nombre || 'Sin nombre registrado';
};

const buildDocumentoLabel = (documentos: Array<string | null | undefined>) => {
  const disponibles = documentos.map((documento) => documento?.trim()).filter(Boolean);
  return disponibles.length > 0 ? `DNI ${disponibles.join(' / ')}` : 'Sin DNI registrado';
};

const getRegistroIdParticipante = (participante: SorteoParticipante, registroTipo: SorteoRegistroTipo) => {
  if (registroTipo === SORTEO_REGISTRO_TIPOS.CONVERSION) return participante.inscripcion_conversion_id;
  if (registroTipo === SORTEO_REGISTRO_TIPOS.MATRIMONIOS) return participante.inscripcion_matrimonios_id;
  return participante.misionero_id;
};

const buildRegistrosAgregados = (participantes: SorteoParticipante[], registroTipo: SorteoRegistroTipo) =>
  new Set(
    participantes
      .filter((participante) => participante.registro_tipo === registroTipo)
      .map((participante) => getRegistroIdParticipante(participante, registroTipo))
      .filter((id): id is string => Boolean(id)),
  );

const mapConversionRegistro = (inscripcion: InscripcionConversion): SorteoRegistroDisponible => ({
  id: inscripcion.id,
  label: `${buildNombreCompleto([inscripcion.nombre, inscripcion.apellido])} · ${buildDocumentoLabel([inscripcion.dni])}`,
});

const mapMatrimoniosRegistro = (inscripcion: InscripcionMatrimonios): SorteoRegistroDisponible => ({
  id: inscripcion.id,
  label: `${buildNombreCompleto([inscripcion.nombre_esposo, inscripcion.apellido_esposo])} y ${buildNombreCompleto([
    inscripcion.nombre_esposa,
    inscripcion.apellido_esposa,
  ])} · ${buildDocumentoLabel([inscripcion.dni_esposo, inscripcion.dni_esposa])}`,
});

const mapMisionerosRegistro = (misionero: Misionero): SorteoRegistroDisponible => ({
  id: misionero.id,
  label: `${buildNombreCompleto([misionero.nombre, misionero.apellido])} · ${buildDocumentoLabel([misionero.dni])}`,
});

const invalidateSorteoDetail = async (queryClient: ReturnType<typeof useQueryClient>, sorteoId: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.sorteo(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.participantes(sorteoId) }),
    queryClient.invalidateQueries({ queryKey: SORTEOS_QUERY_KEYS.registrosDisponiblesBase(sorteoId) }),
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

export const useSorteoRegistrosDisponibles = (sorteoId: string, registroTipo: SorteoRegistroTipo) => {
  const supabase = createClient();

  return useQuery({
    queryKey: SORTEOS_QUERY_KEYS.registrosDisponibles(sorteoId, registroTipo),
    queryFn: async () => {
      const { data: participantes, error: participantesError } = await supabase
        .from('sorteo_participantes')
        .select('*')
        .eq('sorteo_id', sorteoId)
        .eq('registro_tipo', registroTipo);

      if (participantesError) throw participantesError;

      const registrosAgregados = buildRegistrosAgregados(participantes ?? [], registroTipo);

      if (registroTipo === SORTEO_REGISTRO_TIPOS.CONVERSION) {
        const { data, error } = await supabase
          .from('inscripciones_retiro_conversion')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []).map(mapConversionRegistro).filter((registro) => !registrosAgregados.has(registro.id));
      }

      if (registroTipo === SORTEO_REGISTRO_TIPOS.MATRIMONIOS) {
        const { data, error } = await supabase
          .from('inscripciones_retiro_matrimonios')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []).map(mapMatrimoniosRegistro).filter((registro) => !registrosAgregados.has(registro.id));
      }

      const { data, error } = await supabase
        .from('misioneros')
        .select('*')
        .order('apellido', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapMisionerosRegistro).filter((registro) => !registrosAgregados.has(registro.id));
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
