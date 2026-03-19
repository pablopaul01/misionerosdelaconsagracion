import Image from 'next/image';

export default function PublicLoading() {
  return (
    <main
      className="relative min-h-dvh flex flex-col items-center justify-center bg-brand-cream px-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logomisioneros.png"
          alt="Logo"
          width={80}
          height={80}
          className="object-contain"
        />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-brown border-t-transparent" />
        <p className="text-sm text-brand-brown">Cargando...</p>
      </div>
    </main>
  );
}
