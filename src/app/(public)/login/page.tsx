import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { USER_ROLES } from '@/lib/constants/roles';
import { LoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Iniciar sesión — Misioneros de la Consagración',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    redirect(profile?.role === USER_ROLES.ADMIN ? '/admin/dashboard' : '/secretario/inscripciones');
  }
  return (
    <main className="min-h-dvh flex items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logomisioneros.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-contain"
          />
          <h1 className="font-title text-brand-dark text-xl tracking-wide text-center">
            Misioneros de la Consagración
          </h1>
          <p className="text-sm text-brand-brown text-center">Área de gestión interna</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
