export default function SecretarioLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-brown border-t-transparent" />
        <p className="text-sm text-brand-brown">Cargando panel de secretaría...</p>
      </div>

      <div className="max-w-xs">
        <div className="h-10 animate-pulse rounded-lg border border-brand-creamLight bg-white" />
      </div>

      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
        <div className="h-16 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
        <div className="h-16 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
      </div>
    </div>
  );
}
