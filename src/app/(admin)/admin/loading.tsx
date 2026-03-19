export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-brown border-t-transparent" />
        <p className="text-sm text-brand-brown">Cargando panel administrativo...</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
        <div className="h-28 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
        <div className="h-28 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
      </div>

      <div className="h-64 animate-pulse rounded-xl border border-brand-creamLight bg-white" />
    </div>
  );
}
