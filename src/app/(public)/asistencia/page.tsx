'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatFechaLarga } from '@/lib/utils/dates';
import { TIPO_FORMACION_LABEL } from '@/lib/constants/formaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  buscarMisioneroFormacion,
  registrarAsistenciaFormacion,
  type ClaseActiva,
  type MisioneroEncontrado,
} from './actions';

type Estado = 'buscar' | 'confirmar' | 'registrado' | 'sin-clase' | 'ya-registrado';

export default function AsistenciaPage() {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('buscar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [seleccion, setSeleccion] = useState<'asistio' | 'no_asistio' | null>(null);
  const [motivoAusencia, setMotivoAusencia] = useState('');
  const [misionero, setMisionero] = useState<MisioneroEncontrado | null>(null);
  const [claseActiva, setClaseActiva] = useState<ClaseActiva | null>(null);

  const buscarMisionero = async () => {
    if (!dni.trim()) return;
    setBuscando(true);
    setErrorMsg(null);

    const result = await buscarMisioneroFormacion(dni);

    if (!result.ok) {
      setErrorMsg(result.error);
      setBuscando(false);
      return;
    }

    if (result.estado === 'sin-clase') {
      setMisionero(result.misionero);
      setEstado('sin-clase');
    } else if (result.estado === 'ya-registrado') {
      setMisionero(result.misionero);
      setEstado('ya-registrado');
    } else {
      setMisionero(result.misionero);
      setClaseActiva(result.clase);
      setEstado('confirmar');
    }

    setBuscando(false);
  };

  const registrarAsistencia = async (asistio: boolean) => {
    if (!misionero || !claseActiva) return;
    setGuardando(true);

    await registrarAsistenciaFormacion(misionero.id, claseActiva.id, asistio, motivoAusencia);

    setEstado('registrado');
    setGuardando(false);
  };

  const reiniciar = () => {
    setDni('');
    setEstado('buscar');
    setErrorMsg(null);
    setMisionero(null);
    setClaseActiva(null);
    setSeleccion(null);
    setMotivoAusencia('');
  };

  const handleConfirmar = () => {
    if (!seleccion) return;
    registrarAsistencia(seleccion === 'asistio');
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
          Registro de Asistencia
        </h1>

        {/* PASO 1: Ingresar DNI */}
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

        {/* PASO 2: Confirmar asistencia */}
        {estado === 'confirmar' && misionero && claseActiva && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full flex flex-col gap-5">
            <div className="bg-brand-creamLight rounded-lg p-4">
              <p className="font-title text-brand-dark text-lg">
                {misionero.apellido}, {misionero.nombre}
              </p>
              <p className="text-sm text-brand-brown mt-1">
                {TIPO_FORMACION_LABEL[claseActiva.formacion.tipo]} {claseActiva.formacion.anio}
              </p>
              <p className="text-sm text-brand-brown">
                Clase {claseActiva.numero} — {formatFechaLarga(claseActiva.fecha)}
              </p>
            </div>

            <p className="text-center text-brand-dark font-medium">¿Pudiste asistir a esta clase?</p>

            {/* Opciones seleccionables */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSeleccion('asistio')}
                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                  seleccion === 'asistio'
                    ? 'border-green-600 bg-green-50'
                    : 'border-brand-creamLight hover:border-green-300'
                }`}
              >
                <span className="text-2xl">✓</span>
                <span className={`text-sm font-medium ${seleccion === 'asistio' ? 'text-green-700' : 'text-brand-dark'}`}>
                  Sí, asistí
                </span>
              </button>

              <button
                onClick={() => setSeleccion('no_asistio')}
                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                  seleccion === 'no_asistio'
                    ? 'border-red-400 bg-red-50'
                    : 'border-brand-creamLight hover:border-red-200'
                }`}
              >
                <span className="text-2xl">✗</span>
                <span className={`text-sm font-medium ${seleccion === 'no_asistio' ? 'text-red-600' : 'text-brand-dark'}`}>
                  No pude asistir
                </span>
              </button>
            </div>

            {/* Motivo — solo si eligió "no asistió" */}
            {seleccion === 'no_asistio' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Estaba enfermo, trabajo, etc."
                  value={motivoAusencia}
                  onChange={(e) => setMotivoAusencia(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <Button
              onClick={handleConfirmar}
              disabled={!seleccion || guardando}
              className="bg-brand-brown hover:bg-brand-dark text-white font-title tracking-wide py-5 disabled:opacity-40"
            >
              {guardando ? 'Registrando...' : 'Confirmar'}
            </Button>
          </div>
        )}

        {/* Estado: ya registrado */}
        {estado === 'ya-registrado' && misionero && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-4">
            <p className="text-2xl">✅</p>
            <p className="font-title text-brand-dark">Tu asistencia ya fue registrada</p>
            <p className="text-sm text-brand-brown">
              {misionero.apellido}, {misionero.nombre}
            </p>
            <Button variant="outline" onClick={reiniciar} className="mt-2">
              Volver al inicio
            </Button>
          </div>
        )}

        {/* Estado: sin clase activa */}
        {estado === 'sin-clase' && misionero && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-4">
            <p className="text-2xl">📭</p>
            <p className="font-title text-brand-dark">No hay clase activa</p>
            <p className="text-sm text-brand-brown">
              {misionero.apellido}, {misionero.nombre} — en este momento no hay ninguna clase activa para tu formación.
            </p>
            <Button variant="outline" onClick={reiniciar} className="mt-2">
              Volver al inicio
            </Button>
          </div>
        )}

        {/* Estado: registrado exitosamente */}
        {estado === 'registrado' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full text-center flex flex-col gap-4">
            <p className="text-4xl">🙏</p>
            <p className="font-title text-brand-dark text-lg">¡Gracias!</p>
            <p className="text-sm text-brand-brown">Tu asistencia fue registrada correctamente.</p>
            <Button variant="outline" onClick={reiniciar} className="mt-2">
              Volver al inicio
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
