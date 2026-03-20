'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatFechaLarga } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buscarMisioneroGrupo,
  registrarAsistenciaGrupo,
  type GrupoActivo,
  type MisioneroEncontrado,
} from './actions';

type Estado = 'buscar' | 'confirmar' | 'registrado' | 'sin-grupo' | 'ya-registrado';

export default function GrupoOracionAsistenciaPage() {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('buscar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [misionero, setMisionero] = useState<MisioneroEncontrado | null>(null);
  const [grupoActivo, setGrupoActivo] = useState<GrupoActivo | null>(null);

  const buscarMisionero = async () => {
    if (!dni.trim()) return;
    setBuscando(true);
    setErrorMsg(null);

    const result = await buscarMisioneroGrupo(dni);

    if (!result.ok) {
      setErrorMsg(result.error);
      setBuscando(false);
      return;
    }

    if (result.estado === 'sin-grupo') {
      setEstado('sin-grupo');
    } else if (result.estado === 'ya-registrado') {
      setMisionero(result.misionero);
      setGrupoActivo(result.grupo);
      setEstado('ya-registrado');
    } else {
      setMisionero(result.misionero);
      setGrupoActivo(result.grupo);
      setEstado('confirmar');
    }

    setBuscando(false);
  };

  const registrarAsistencia = async () => {
    if (!misionero || !grupoActivo) return;
    setGuardando(true);

    await registrarAsistenciaGrupo(misionero.id, grupoActivo.id);

    setEstado('registrado');
    setGuardando(false);
  };

  const reiniciar = () => {
    setDni('');
    setEstado('buscar');
    setErrorMsg(null);
    setMisionero(null);
    setGrupoActivo(null);
  };

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Image
          src="/logomisioneros.png"
          alt="Logo"
          width={180}
          height={180}
          className="object-contain"
        />
        <h1 className="font-title text-brand-dark text-xl tracking-wide text-center">
          Grupo de oración
        </h1>

        {estado === 'buscar' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dni">Ingresá tu DNI</Label>
              <Input
                id="dni"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 35123456"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarMisionero()}
                className="text-lg"
              />
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            </div>
            <Button
              onClick={buscarMisionero}
              disabled={buscando || !dni.trim()}
              className="bg-brand-brown hover:bg-brand-dark text-white font-title tracking-wide"
            >
              {buscando ? 'Buscando...' : 'Confirmar DNI'}
            </Button>
          </div>
        )}

        {estado === 'sin-grupo' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-3">
            <p className="font-title text-brand-dark">No hay grupo activo</p>
            <p className="text-sm text-brand-brown">Volvé a intentarlo cuando esté habilitado.</p>
            <Button variant="outline" onClick={reiniciar}>Volver</Button>
          </div>
        )}

        {estado === 'confirmar' && misionero && grupoActivo && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full flex flex-col gap-5">
            <div className="bg-brand-creamLight rounded-lg p-4">
              <p className="font-title text-brand-dark text-lg">
                {misionero.apellido}, {misionero.nombre}
              </p>
              <p className="text-sm text-brand-brown">
                {formatFechaLarga(grupoActivo.fecha)}
              </p>
            </div>

            <p className="text-center text-brand-dark font-medium">Confirmá tu asistencia al grupo de oración</p>

            <Button
              onClick={registrarAsistencia}
              disabled={guardando}
              className="bg-brand-teal hover:bg-brand-navy text-white font-title tracking-wide"
            >
              {guardando ? 'Registrando...' : 'Registrar asistencia'}
            </Button>
          </div>
        )}

        {estado === 'ya-registrado' && misionero && grupoActivo && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-3">
            <p className="font-title text-brand-dark">Tu asistencia ya fue registrada</p>
            <p className="text-sm text-brand-brown">
              {misionero.apellido}, {misionero.nombre} · {formatFechaLarga(grupoActivo.fecha)}
            </p>
            <Button variant="outline" onClick={reiniciar}>Volver</Button>
          </div>
        )}

        {estado === 'registrado' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-3">
            <p className="text-4xl">✅</p>
            <p className="font-title text-brand-dark">Asistencia registrada</p>
            <Button variant="outline" onClick={reiniciar}>Registrar otra</Button>
          </div>
        )}
      </div>
    </main>
  );
}
