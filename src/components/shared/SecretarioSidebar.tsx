'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/secretario/inscripciones', label: 'Inscripciones' },
  { href: '/secretario/asistencias',   label: 'Asistencias' },
] as const;

interface SecretarioSidebarProps {
  nombre: string;
}

export const SecretarioSidebar = ({ nombre }: SecretarioSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center gap-3 pb-4">
        <Image
          src="/logomisioneros_blanco.png"
          alt="Logo"
          width={90}
          height={90}
          className="object-contain"
        />
        <span className="font-title text-brand-creamLight text-xs tracking-widest uppercase text-center leading-tight">
          Consagración
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-body transition-colors',
              pathname.startsWith(href)
                ? 'bg-brand-brown text-white'
                : 'text-brand-cream hover:bg-brand-brown/30',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-brand-brown/40 pt-4">
        <span className="text-xs text-brand-cream/60 truncate">{nombre}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-brand-teal hover:text-white text-left transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 min-h-screen bg-brand-dark flex-col py-6 px-4 shrink-0">
        <NavContent />
      </aside>

      {/* Mobile: barra superior fija + Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-brand-dark flex items-center justify-between px-4">
          <SheetTrigger asChild>
            <button className="text-brand-cream p-1 -ml-1" aria-label="Abrir menú">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <Image
            src="/logomisioneros_blanco.png"
            alt="Logo"
            width={94}
            height={94}
            className="object-contain"
          />
          <div className="w-8" />
        </div>
        <SheetContent side="left" className="bg-brand-dark border-r border-brand-brown/40 w-64 p-6">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
};
