import { SorteoDetailClient } from '@/components/sorteos/SorteoDetailClient';

export const dynamic = 'force-dynamic';

interface SorteoDetailPageProps {
  params: { id: string };
}

export default function SorteoDetailPage({ params }: SorteoDetailPageProps) {
  return <SorteoDetailClient sorteoId={params.id} />;
}
