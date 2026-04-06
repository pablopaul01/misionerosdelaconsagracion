'use client';

import { useMemo } from 'react';
import { Users, UserCheck, UserRoundSearch } from 'lucide-react';
import { useInscripcionesConsagracion } from '@/lib/queries/consagracion';
import { ESTADO_CIVIL_LABEL, INSCRIPCION_ESTADO, INSCRIPCION_ESTADO_LABEL } from '@/lib/constants/consagracion';
import type { Database } from '@/types/supabase';

type Inscripcion = Database['public']['Tables']['inscripciones_consagracion']['Row'];

interface InscripcionesEstadisticasViewProps {
  formacionId: string;
}

interface DistributionItem {
  label: string;
  count: number;
}

const TIPO_LABELS: Record<string, string> = {
  primera_vez: 'Primera vez',
  renovacion: 'Renovacion',
};

const toDistribution = (data: Record<string, number>) =>
  Object.entries(data)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

const DistributionChart = ({
  title,
  items,
  total,
}: {
  title: string;
  items: DistributionItem[];
  total: number;
}) => {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="bg-white border border-brand-creamLight rounded-xl p-5">
      <h3 className="font-title text-brand-dark text-lg">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => {
          const width = (item.count / maxCount) * 100;
          const percentage = total === 0 ? 0 : (item.count / total) * 100;

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-brand-dark">{item.label}</span>
                <span className="text-brand-brown">{item.count} ({percentage.toFixed(1)}%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-brand-creamLight/70 overflow-hidden">
                <div
                  className="h-full bg-brand-teal transition-all duration-300"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const InscripcionesEstadisticasView = ({ formacionId }: InscripcionesEstadisticasViewProps) => {
  const { data: rawInscripciones = [], isLoading } = useInscripcionesConsagracion(formacionId);

  const {
    totalRegistros,
    totalInscriptos,
    totalAContactar,
    tipos,
    estadoCivil,
  } = useMemo(() => {
    const inscripciones = rawInscripciones as Inscripcion[];
    const totalRegistros = inscripciones.length;
    const totalInscriptos = inscripciones.filter((item) => item.estado_inscripcion === INSCRIPCION_ESTADO.INSCRIPTO).length;
    const totalAContactar = inscripciones.filter((item) => item.estado_inscripcion === INSCRIPCION_ESTADO.CONTACTAR).length;

    const tipoMap: Record<string, number> = {
      [TIPO_LABELS.primera_vez]: 0,
      [TIPO_LABELS.renovacion]: 0,
      'Sin dato': 0,
    };

    const estadoCivilMap: Record<string, number> = {
      [ESTADO_CIVIL_LABEL.soltero_a]: 0,
      [ESTADO_CIVIL_LABEL.casado]: 0,
      [ESTADO_CIVIL_LABEL.divorciado]: 0,
      [ESTADO_CIVIL_LABEL.viudo]: 0,
      'Sin dato': 0,
    };

    inscripciones.forEach((item) => {
      const tipoLabel = item.tipo_inscripcion ? (TIPO_LABELS[item.tipo_inscripcion] ?? item.tipo_inscripcion) : 'Sin dato';
      tipoMap[tipoLabel] = (tipoMap[tipoLabel] ?? 0) + 1;

      const civilLabel = item.estado_civil ? (ESTADO_CIVIL_LABEL[item.estado_civil] ?? item.estado_civil) : 'Sin dato';
      estadoCivilMap[civilLabel] = (estadoCivilMap[civilLabel] ?? 0) + 1;
    });

    return {
      totalRegistros,
      totalInscriptos,
      totalAContactar,
      tipos: toDistribution(tipoMap),
      estadoCivil: toDistribution(estadoCivilMap),
    };
  }, [rawInscripciones]);

  if (isLoading) {
    return <p className="text-brand-brown">Cargando estadisticas...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-brand-creamLight rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-creamLight flex items-center justify-center">
            <Users className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <p className="text-xs text-brand-brown">Total registros</p>
            <p className="font-title text-xl text-brand-dark">{totalRegistros}</p>
          </div>
        </div>
        <div className="bg-white border border-brand-creamLight rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-creamLight flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <p className="text-xs text-brand-brown">{INSCRIPCION_ESTADO_LABEL.inscripto}</p>
            <p className="font-title text-xl text-brand-dark">{totalInscriptos}</p>
          </div>
        </div>
        <div className="bg-white border border-brand-creamLight rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-creamLight flex items-center justify-center">
            <UserRoundSearch className="w-4 h-4 text-brand-teal" />
          </div>
          <div>
            <p className="text-xs text-brand-brown">{INSCRIPCION_ESTADO_LABEL.contactar}</p>
            <p className="font-title text-xl text-brand-dark">{totalAContactar}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DistributionChart title="Distribucion por tipo de inscripcion" items={tipos} total={totalRegistros} />
        <DistributionChart title="Distribucion por estado civil" items={estadoCivil} total={totalRegistros} />
      </div>
    </div>
  );
};
