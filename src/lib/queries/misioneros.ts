import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { MisioneroInput } from '@/lib/validations/misioneros';

// Claves de caché — nunca usar strings literales directamente
const QUERY_KEYS = {
  all:    ['misioneros'] as const,
  detail: (id: string) => ['misioneros', id] as const,
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
