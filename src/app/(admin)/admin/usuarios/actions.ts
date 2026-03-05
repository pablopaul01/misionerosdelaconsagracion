'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { USER_ROLES } from '@/lib/constants/roles';
import { z } from 'zod';

const crearUsuarioSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre:   z.string().min(1, 'El nombre es requerido'),
  role:     z.enum([USER_ROLES.ADMIN, USER_ROLES.SECRETARIO_CONSAGRACION]),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export async function crearUsuario(data: CrearUsuarioInput) {
  const parsed = crearUsuarioSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email:              parsed.data.email,
    password:           parsed.data.password,
    email_confirm:      true,
  });

  if (authError) return { error: authError.message };

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: authData.user.id, nombre: parsed.data.nombre, role: parsed.data.role });

  if (profileError) {
    // Revertir creación de usuario auth
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  return { success: true };
}

export async function listarUsuarios() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('id, nombre, role')
    .order('nombre');

  if (error) return { error: error.message };

  // Obtener emails de Auth
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) return { error: authError.message };

  const emailMap = Object.fromEntries(authData.users.map((u) => [u.id, u.email]));

  return {
    usuarios: (data ?? []).map((p) => ({
      id:     p.id,
      nombre: p.nombre,
      role:   p.role,
      email:  emailMap[p.id] ?? '',
    })),
  };
}

export async function eliminarUsuario(id: string) {
  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) return { error: authError.message };

  return { success: true };
}
