import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { MisioneroInput } from '@/lib/validations/misioneros';

// Claves de caché — nunca usar strings literales directamente
const QUERY_KEYS = {
  all:    ['misioneros'] as const,
  detail: (id: string) => ['misioneros', id] as const,
  roles: ['roles-misionero'] as const,
  rolesActivos: ['roles-misionero', 'activos'] as const,
  misioneroRoles: (id: string) => ['misioneros', id, 'roles'] as const,
  misionerosRolesMap: ['misioneros', 'roles-map'] as const,
};

export const useMisioneros = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.all,
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

export const useMisionero = (id: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('misioneros')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateMisionero = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MisioneroInput) => {
      const { data, error } = await supabase
        .from('misioneros')
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

export const useUpdateMisionero = (id: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<MisioneroInput>) => {
      const { data, error } = await supabase
        .from('misioneros')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
};

type RolMisioneroInput = {
  nombre: string;
  descripcion: string;
  activo: boolean;
};

export const useRolesMisionero = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.roles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles_misionero')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
};

export const useRolesMisioneroActivos = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.rolesActivos,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles_misionero')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateRolMisionero = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RolMisioneroInput) => {
      const { data, error } = await supabase
        .from('roles_misionero')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesActivos });
    },
  });
};

export const useUpdateRolMisionero = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<RolMisioneroInput> }) => {
      const { error } = await supabase
        .from('roles_misionero')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesActivos });
    },
  });
};

export const useDeleteRolMisionero = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roles_misionero').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolesActivos });
    },
  });
};

export const useMisioneroRoles = (misioneroId: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.misioneroRoles(misioneroId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('misioneros_roles')
        .select('rol_id')
        .eq('misionero_id', misioneroId);
      if (error) throw error;
      return data?.map((r) => r.rol_id) ?? [];
    },
    enabled: !!misioneroId,
  });
};

export const useSetMisioneroRoles = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ misioneroId, roleIds }: { misioneroId: string; roleIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from('misioneros_roles')
        .delete()
        .eq('misionero_id', misioneroId);
      if (deleteError) throw deleteError;

      if (roleIds.length > 0) {
        const { error: insertError } = await supabase
          .from('misioneros_roles')
          .insert(roleIds.map((rolId) => ({ misionero_id: misioneroId, rol_id: rolId })));
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { misioneroId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.misioneroRoles(misioneroId) });
    },
  });
};

type MisioneroRoleRow = {
  misionero_id: string;
  roles_misionero: { id: string; nombre: string } | null;
};

export const useMisionerosRolesMap = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: QUERY_KEYS.misionerosRolesMap,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('misioneros_roles')
        .select('misionero_id, roles_misionero ( id, nombre )');
      if (error) throw error;

      const map: Record<string, { id: string; nombre: string }[]> = {};
      const rows = data as unknown as MisioneroRoleRow[] | null;
      rows?.forEach((row) => {
        if (!row.roles_misionero) return;
        if (!map[row.misionero_id]) map[row.misionero_id] = [];
        map[row.misionero_id].push(row.roles_misionero);
      });
      return map;
    },
  });
};
