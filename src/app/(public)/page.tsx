import Image from 'next/image';
import Link from 'next/link';
import { InkRevealLogo } from '@/components/shared/InkRevealLogo';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center bg-brand-cream px-4 overflow-hidden">
      {/* Marca de agua */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <Image
          src="/logo_parroquia.png"
          alt=""
          width={420}
          height={420}
          className="object-contain opacity-[0.07]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <InkRevealLogo />
        <Link
          href="/login"
          className="text-sm text-brand-brown/60 hover:text-brand-brown transition-colors tracking-wide"
        >
          Acceso interno →
        </Link>
      </div>
    </main>
  );
}
