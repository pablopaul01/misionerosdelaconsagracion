import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActividadManualInput, ActividadUpdateInput } from '@/lib/validations/calendario';
import { CALENDARIO_DEFAULT_RANGE_DIAS } from '@/lib/constants/calendario';

type ActividadCalendario = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: string;
  estado: 'activo' | 'cancelado';
  origen_tipo:
    | 'manual'
    | 'consagracion_formacion'
    | 'consagracion_retiro'
    | 'retiro'
    | 'formacion_misioneros';
  origen_id: string | null;
  sincronizado: boolean;
  dedupe_key: string | null;
  nota_admin: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminListFilters = {
  origen_tipo?: string;
  estado?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
};

const QUERY_KEYS = {
  adminList: (filters: AdminListFilters) => ['calendario-admin', filters] as const,
};

const toQueryString = (filters: AdminListFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return params.toString();
};

export const useCalendarioAdmin = (filters: AdminListFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminList(filters),
    queryFn: async () => {
      const query = toQueryString(filters);
      const response = await fetch(`/api/admin/calendario${query ? `?${query}` : ''}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Error al obtener actividades');
      }

      return payload.actividades as ActividadCalendario[];
    },
  });
};

export const useCreateActividadCalendario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ActividadManualInput) => {
      const response = await fetch('/api/admin/calendario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo crear la actividad');
      }

      return payload.actividad as ActividadCalendario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-admin'] });
    },
  });
};

export const useUpdateActividadCalendario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ActividadUpdateInput }) => {
      const response = await fetch(`/api/admin/calendario/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo actualizar la actividad');
      }

      return payload.actividad as ActividadCalendario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-admin'] });
    },
  });
};

export const useDeleteActividadCalendario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/calendario/${id}`, {
        method: 'DELETE',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo eliminar la actividad');
      }

      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendario-admin'] });
    },
  });
};

// Public calendario hook for missionarios
type MisioneroCalendarioParams = {
  dni: string;
  desde?: string;
  hasta?: string;
};

type MisioneroCalendarioResponse = {
  actividades: ActividadCalendario[];
  message?: string | null;
};

const MISIONERO_QUERY_KEYS = {
  list: (params: MisioneroCalendarioParams) => ['calendario-misionero', params] as const,
};

const getDefaultDateRange = () => {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + CALENDARIO_DEFAULT_RANGE_DIAS);

  return {
    desde: hoy.toISOString().split('T')[0],
    hasta: hasta.toISOString().split('T')[0],
  };
};

export const useCalendarioMisionero = (params: MisioneroCalendarioParams) => {
  return useQuery({
    queryKey: MISIONERO_QUERY_KEYS.list(params),
    queryFn: async () => {
      const { dni, ...rest } = params;
      const defaults = getDefaultDateRange();
      const body = {
        dni,
        desde: rest.desde || defaults.desde,
        hasta: rest.hasta || defaults.hasta,
      };

      const response = await fetch('/api/calendario/misionero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const payload: MisioneroCalendarioResponse = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? 'No se pudo consultar el calendario');
      }

      return payload;
    },
    enabled: !!params.dni.trim(),
  });
};
