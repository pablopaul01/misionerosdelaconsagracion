import { createClient } from '@/lib/supabase/server';
import { TIPO_RETIRO_PUBLICO } from '@/lib/constants/retiros';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RetirosPage() {
  const supabase = await createClient();

  const { data: retiros, error } = await supabase
    .from('retiros')
    .select('*')
    .eq('activo', true)
    .gte('fecha_fin', new Date().toISOString().split('T')[0])
    .order('fecha_inicio', { ascending: true });

  if (error || !retiros || retiros.length === 0) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-title text-3xl text-brand-dark mb-4">Próximos Retiros</h1>
          <p className="text-brand-brown">No hay retiros programados actualmente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-title text-3xl text-brand-dark text-center mb-8">Próximos Retiros</h1>

        <div className="grid gap-6">
          {retiros.map((retiro) => (
            <div
              key={retiro.id}
              className="bg-white rounded-xl shadow-sm border border-brand-creamLight overflow-hidden"
            >
              {retiro.imagen_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={retiro.imagen_url}
                    alt={retiro.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="font-title text-xl text-brand-dark">
                      {TIPO_RETIRO_PUBLICO[retiro.tipo]}
                    </h2>
                    <p className="text-sm text-brand-brown">{retiro.nombre}</p>
                  </div>
                  <span className="bg-brand-creamLight text-brand-brown px-3 py-1 rounded-full text-sm">
                    {retiro.costo === 0 || !retiro.costo ? 'Gratis' : `$${retiro.costo.toLocaleString('es-AR')}`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-brand-brown mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(retiro.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                    {retiro.fecha_fin && (
                      <> - {new Date(retiro.fecha_fin + 'T00:00:00').toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                      })}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {retiro.lugar}
                  </span>
                </div>

                {retiro.descripcion && (
                  <p className="text-brand-brown mb-4">{retiro.descripcion}</p>
                )}

                <Link
                  href={`/retiros/${retiro.id}`}
                  className="inline-flex items-center gap-2 text-brand-teal hover:text-brand-navy font-medium"
                >
                  Inscribirse <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
