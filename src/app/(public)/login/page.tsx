import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';

// Requiere sesión de usuario — no pre-renderizar
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Iniciar sesión — Misioneros de la Consagración',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
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
