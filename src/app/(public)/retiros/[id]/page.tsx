import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TIPO_RETIRO_PUBLICO } from '@/lib/constants/retiros';
import { ConversionForm } from '@/components/retiros/public/ConversionForm';
import { MatrimoniosForm } from '@/components/retiros/public/MatrimoniosForm';
import { MisionerosForm } from '@/components/retiros/public/MisionerosForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RetiroInscripcionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: retiro, error } = await supabase
    .from('retiros')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single();

  if (error || !retiro) {
    redirect('/retiros');
  }

  return (
    <div className="min-h-screen bg-brand-cream py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-title text-3xl text-brand-dark mb-2">
            {TIPO_RETIRO_PUBLICO[retiro.tipo]}
          </h1>
          <p className="text-brand-brown">{retiro.nombre}</p>
        </div>

        {retiro.imagen_url && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={retiro.imagen_url} alt="" className="w-full" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-brand-creamLight p-6">
          {retiro.tipo === 'conversion' && <ConversionForm retiroId={id} />}
          {retiro.tipo === 'matrimonios' && <MatrimoniosForm retiroId={id} />}
          {retiro.tipo === 'misioneros' && <MisionerosForm retiroId={id} />}
        </div>
      </div>
    </div>
  );
}
