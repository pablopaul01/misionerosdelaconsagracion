import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { USER_ROLES } from '@/lib/constants/roles';
import { AdminSidebar } from '@/components/shared/AdminSidebar';
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('role, nombre')
    .eq('id', user.id)
    .single();

  const profile = data as Pick<ProfileRow, 'role' | 'nombre'> | null;

  if (profile?.role !== USER_ROLES.ADMIN) redirect('/login');

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <AdminSidebar nombre={profile.nombre} />
      <main className="flex-1 pt-14 md:pt-0 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
