'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { formatFechaLarga } from '@/lib/utils/dates';
import { TIPO_FORMACION_LABEL } from '@/lib/constants/formaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Estado = 'buscar' | 'confirmar' | 'registrado' | 'sin-clase' | 'ya-registrado';

interface ClaseActiva {
  id: string;
  numero: number;
  fecha: string;
  formacion: {
    tipo: 'san_lorenzo' | 'escuela_de_maria';
    anio: number;
  };
}

interface MisioneroEncontrado {
  id: string;
  nombre: string;
  apellido: string;
}

export default function AsistenciaPage() {
  const supabase = createClient();

  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('buscar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [motivoAusencia, setMotivoAusencia] = useState('');
  const [misionero, setMisionero] = useState<MisioneroEncontrado | null>(null);
  const [claseActiva, setClaseActiva] = useState<ClaseActiva | null>(null);

  const buscarMisionero = async () => {
    if (!dni.trim()) return;
    setBuscando(true);
    setErrorMsg(null);

    const { data: misioneroData, error: misioneroError } = await supabase
      .from('misioneros')
      .select('id, nombre, apellido')
      .eq('dni', dni.trim())
      .single();

    if (misioneroError || !misioneroData) {
      setErrorMsg('No encontramos un misionero con ese DNI');
      setBuscando(false);
      return;
    }

    // Buscar clase activa donde el misionero esté inscripto
    const { data: clasesActivas } = await supabase
      .from('clases')
      .select('id, numero, fecha, formaciones_misioneros!inner(tipo, anio, inscripciones_misioneros!inner(misionero_id))')
      .eq('activa', true)
      .eq('formaciones_misioneros.inscripciones_misioneros.misionero_id', misioneroData.id);

    const clase = clasesActivas?.[0];

    if (!clase) {
      setMisionero(misioneroData);
      setEstado('sin-clase');
      setBuscando(false);
      return;
    }

    // Verificar si ya registró asistencia a esta clase
    const { data: asistenciaExistente } = await supabase
      .from('asistencias_misioneros')
      .select('id')
      .eq('clase_id', clase.id)
      .eq('misionero_id', misioneroData.id)
      .single();

    if (asistenciaExistente) {
      setMisionero(misioneroData);
      setEstado('ya-registrado');
      setBuscando(false);
      return;
    }

    const formacion = clase.formaciones_misioneros as unknown as { tipo: 'san_lorenzo' | 'escuela_de_maria'; anio: number };

    setMisionero(misioneroData);
    setClaseActiva({ id: clase.id, numero: clase.numero, fecha: clase.fecha, formacion });
    setEstado('confirmar');
    setBuscando(false);
  };

  const registrarAsistencia = async (asistio: boolean) => {
    if (!misionero || !claseActiva) return;
    setGuardando(true);

    await supabase.from('asistencias_misioneros').insert({
      clase_id:        claseActiva.id,
      misionero_id:    misionero.id,
      asistio,
      motivo_ausencia: asistio ? null : (motivoAusencia || null),
    });

    setEstado('registrado');
    setGuardando(false);
  };

  const reiniciar = () => {
    setDni('');
    setEstado('buscar');
    setErrorMsg(null);
    setMisionero(null);
    setClaseActiva(null);
    setMotivoAusencia('');
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
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full flex flex-col gap-4">
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

            {/* Botón SÍ con confirmación */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6">
                  ✓ Sí, asistí
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar asistencia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Registrarás tu presencia en la clase {claseActiva.numero}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => registrarAsistencia(true)}
                    disabled={guardando}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Botón NO — despliega campo de motivo */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="motivo">No pude asistir — motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ej: Estaba enfermo, trabajo, etc."
                  value={motivoAusencia}
                  onChange={(e) => setMotivoAusencia(e.target.value)}
                  rows={2}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-400 text-red-600 hover:bg-red-50">
                    ✗ No pude asistir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Registrar ausencia?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se registrará tu ausencia en la clase {claseActiva.numero}. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => registrarAsistencia(false)}
                      disabled={guardando}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Registrar ausencia
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
