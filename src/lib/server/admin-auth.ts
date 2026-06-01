import { USER_ROLES } from '@/lib/constants/roles';
import { createClient } from '@/lib/supabase/server';

export const assertAdminSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: 'No autenticado' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== USER_ROLES.ADMIN) {
    return { ok: false as const, status: 403, error: 'Sin permisos' };
  }

  return { ok: true as const, userId: user.id };
};

export const assertAdminOrRetiroSession = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: 'No autenticado' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const rolesPermitidos = [USER_ROLES.ADMIN, USER_ROLES.RETIRO] as string[];

  if (profileError || !profile?.role || !rolesPermitidos.includes(profile.role)) {
    return { ok: false as const, status: 403, error: 'Sin permisos' };
  }

  return { ok: true as const, userId: user.id, role: profile.role };
};
