import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { USER_ROLES } from '@/lib/constants/roles';
import { SecretarioSidebar } from '@/components/shared/SecretarioSidebar';
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function SecretarioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('role, nombre')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<ProfileRow, 'role' | 'nombre'> | null;

  const rolesPermitidos: ProfileRow['role'][] = [
    USER_ROLES.ADMIN,
    USER_ROLES.SECRETARIO_CONSAGRACION,
  ];

  if (!profile?.role || !rolesPermitidos.includes(profile.role)) redirect('/login');

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <SecretarioSidebar nombre={profile.nombre} />
      <main className="flex-1 pt-14 md:pt-0 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
