'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Gift, Plus, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  SORTEO_METODO_PAGO_LABEL,
  SORTEO_METODOS_PAGO,
  SORTEO_REGISTRO_TIPO_LABEL,
  SORTEO_REGISTRO_TIPOS,
  SORTEOS_ROUTES,
  type SorteoMetodoPago,
  type SorteoRegistroTipo,
} from '@/lib/constants/sorteos';
import {
  useAgregarParticipanteSorteo,
  useAsignarNumerosSorteo,
  useRegistrarPagoSorteo,
  useSortearGanadoresSorteo,
  useSorteo,
  useSorteoGanadores,
  useSorteoNumeros,
  useSorteoPagos,
  useSorteoParticipantes,
  useSorteoRegistrosDisponibles,
} from '@/lib/queries/sorteos';

interface SorteoDetailClientProps {
  sorteoId: string;
}

export function SorteoDetailClient({ sorteoId }: SorteoDetailClientProps) {
  const router = useRouter();
  const { data: sorteo, isLoading } = useSorteo(sorteoId);
  const { data: participantes = [] } = useSorteoParticipantes(sorteoId);
  const { data: numeros = [] } = useSorteoNumeros(sorteoId);
  const { data: pagos = [] } = useSorteoPagos(sorteoId);
  const { data: ganadores = [] } = useSorteoGanadores(sorteoId);

  const agregarParticipante = useAgregarParticipanteSorteo();
  const asignarNumeros = useAsignarNumerosSorteo();
  const registrarPago = useRegistrarPagoSorteo();
  const sortearGanadores = useSortearGanadoresSorteo();

  const [registroTipo, setRegistroTipo] = useState<SorteoRegistroTipo>(SORTEO_REGISTRO_TIPOS.CONVERSION);
  const [registroId, setRegistroId] = useState('');
  const [registroSearch, setRegistroSearch] = useState('');
  const [participanteId, setParticipanteId] = useState('');
  const [rendicionParticipanteId, setRendicionParticipanteId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [numerosSeleccionados, setNumerosSeleccionados] = useState<number[]>([]);
  const [efectivo, setEfectivo] = useState('');
  const [transferencia, setTransferencia] = useState('');

  const { data: registrosDisponibles = [], isLoading: registrosDisponiblesLoading } = useSorteoRegistrosDisponibles(
    sorteoId,
    registroTipo,
  );

  const totalRendido = useMemo(
    () => Number(efectivo || 0) + Number(transferencia || 0),
    [efectivo, transferencia],
  );
  const totalRequerido = useMemo(
    () => numerosSeleccionados.length * Number(sorteo?.costo_numero ?? 0),
    [numerosSeleccionados.length, sorteo?.costo_numero],
  );
  const registrosFiltrados = useMemo(() => {
    const search = registroSearch.trim().toLowerCase();

    if (!search) return registrosDisponibles;

    return registrosDisponibles.filter((registro) => registro.label.toLowerCase().includes(search));
  }, [registroSearch, registrosDisponibles]);
  const registroSeleccionado = registrosDisponibles.find((registro) => registro.id === registroId);

  const numerosDelParticipante = useMemo(
    () => numeros.filter((numero) => numero.participante_id === rendicionParticipanteId),
    [numeros, rendicionParticipanteId],
  );
  const numerosPendientesDelParticipante = useMemo(
    () => numerosDelParticipante.filter((numero) => !numero.rendido),
    [numerosDelParticipante],
  );
  const participanteRendicion = participantes.find((participante) => participante.id === rendicionParticipanteId);

  const handleRegistroTipoChange = (value: string) => {
    setRegistroTipo(value as SorteoRegistroTipo);
    setRegistroId('');
    setRegistroSearch('');
  };

  const handleRegistroSelect = (selectedRegistroId: string) => {
    setRegistroId(selectedRegistroId);
  };

  const handleAgregarParticipante = async () => {
    try {
      await agregarParticipante.mutateAsync({ sorteo_id: sorteoId, registro_tipo: registroTipo, registro_id: registroId });
      setRegistroId('');
      setRegistroSearch('');
      toast.success('Participante agregado');
    } catch {
      toast.error('No se pudo agregar: verificá que la inscripción exista o no esté repetida');
    }
  };

  const handleAsignarNumeros = async () => {
    try {
      await asignarNumeros.mutateAsync({ sorteo_id: sorteoId, participante_id: participanteId, cantidad: Number(cantidad) });
      setCantidad('1');
      toast.success('Números asignados');
    } catch {
      toast.error('No se pudieron asignar números');
    }
  };

  const resetRendicion = () => {
    setNumerosSeleccionados([]);
    setEfectivo('');
    setTransferencia('');
  };

  const handleRendicionParticipanteChange = (selectedParticipanteId: string) => {
    setRendicionParticipanteId(selectedParticipanteId);
    resetRendicion();
  };

  const handleToggleNumero = (numero: number) => {
    if (!numerosPendientesDelParticipante.some((numeroPendiente) => numeroPendiente.numero === numero)) return;

    setNumerosSeleccionados((actuales) =>
      actuales.includes(numero)
        ? actuales.filter((seleccionado) => seleccionado !== numero)
        : [...actuales, numero].sort((a, b) => a - b),
    );
  };

  const buildMetodos = () => {
    const metodos: { metodo: SorteoMetodoPago; monto: number }[] = [];
    if (Number(efectivo) > 0) metodos.push({ metodo: SORTEO_METODOS_PAGO.EFECTIVO, monto: Number(efectivo) });
    if (Number(transferencia) > 0) metodos.push({ metodo: SORTEO_METODOS_PAGO.TRANSFERENCIA, monto: Number(transferencia) });
    return metodos;
  };

  const handleRegistrarPago = async () => {
    try {
      await registrarPago.mutateAsync({ sorteo_id: sorteoId, numeros: numerosSeleccionados, metodos: buildMetodos() });
      resetRendicion();
      toast.success('Pago rendido');
    } catch {
      toast.error('El pago debe cubrir exactamente el total requerido');
    }
  };

  const handleSortear = async () => {
    try {
      await sortearGanadores.mutateAsync(sorteoId);
      toast.success('Ganadores sorteados');
    } catch {
      toast.error('No hay números rendidos para sortear');
    }
  };

  if (isLoading) return <p className="text-brand-brown">Cargando...</p>;
  if (!sorteo) return <p className="text-brand-brown">Sorteo no encontrado</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button variant="ghost" className="w-fit text-brand-brown" onClick={() => router.push(SORTEOS_ROUTES.LIST)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-title text-3xl text-brand-dark">{sorteo.nombre}</h1>
            <p className="text-brand-brown">${Number(sorteo.costo_numero).toLocaleString('es-AR')} por número · {sorteo.cantidad_premios} premios</p>
          </div>
          <Badge className="w-fit">{sorteo.estado}</Badge>
        </div>
      </div>

      <Tabs defaultValue="participantes" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="numeros">Números</TabsTrigger>
          <TabsTrigger value="pagos">Rendiciones</TabsTrigger>
          <TabsTrigger value="ganadores">Ganadores</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <Card>
            <CardHeader><CardTitle>Agregar registro</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={registroTipo} onValueChange={handleRegistroTipoChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SORTEO_REGISTRO_TIPO_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Registro</Label>
                  <Input
                    value={registroSearch}
                    onChange={(event) => setRegistroSearch(event.target.value)}
                    placeholder={registrosDisponiblesLoading ? 'Cargando registros...' : 'Buscar por nombre o DNI'}
                    disabled={registrosDisponiblesLoading || registrosDisponibles.length === 0}
                  />
                  {registroSeleccionado ? (
                    <p className="text-sm text-brand-brown">Seleccionada: {registroSeleccionado.label}</p>
                  ) : null}
                  {!registrosDisponiblesLoading && registrosDisponibles.length > 0 ? (
                    <div className="max-h-56 overflow-y-auto rounded-md border bg-background">
                      {registrosFiltrados.length > 0 ? (
                        registrosFiltrados.map((registro) => (
                          <button
                            key={registro.id}
                            type="button"
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-brand-creamLight ${
                              registroId === registro.id ? 'bg-brand-creamLight font-medium text-brand-dark' : 'text-brand-brown'
                            }`}
                            onClick={() => handleRegistroSelect(registro.id)}
                          >
                            <span>{registro.label}</span>
                            {registroId === registro.id ? <span className="text-xs">Seleccionada</span> : null}
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-sm text-brand-brown">No hay registros que coincidan con la búsqueda.</p>
                      )}
                    </div>
                  ) : null}
                  {!registrosDisponiblesLoading && registrosDisponibles.length === 0 ? (
                    <p className="text-sm text-brand-brown">No hay registros disponibles para este tipo.</p>
                  ) : null}
                </div>
                <Button onClick={handleAgregarParticipante} disabled={!registroId || registrosDisponiblesLoading || agregarParticipante.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
              <div className="divide-y rounded-lg border">
                {participantes.map((participante) => (
                  <div key={participante.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="font-medium text-brand-dark">{participante.nombre}</p>
                      <p className="text-sm text-brand-brown">{SORTEO_REGISTRO_TIPO_LABEL[participante.registro_tipo]}</p>
                    </div>
                    <Button variant="outline" onClick={() => setParticipanteId(participante.id)}>Asignar números</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numeros">
          <Card>
            <CardHeader><CardTitle>Asignación secuencial</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-[1fr_140px_auto] md:items-end">
                <div className="flex flex-col gap-1.5">
                  <Label>Participante</Label>
                  <Select value={participanteId} onValueChange={setParticipanteId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar participante" /></SelectTrigger>
                    <SelectContent>
                      {participantes.map((participante) => (
                        <SelectItem key={participante.id} value={participante.id}>{participante.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Cantidad</Label>
                  <Input type="number" value={cantidad} onChange={(event) => setCantidad(event.target.value)} />
                </div>
                <Button onClick={handleAsignarNumeros} disabled={!participanteId || asignarNumeros.isPending}>
                  <Ticket className="mr-2 h-4 w-4" /> Asignar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
                {numeros.map((numero) => (
                  <div key={numero.id} className="rounded-lg border p-3 text-center">
                    <p className="font-semibold text-brand-dark">#{numero.numero}</p>
                    <p className="text-xs text-brand-brown">{numero.rendido ? 'Rendido' : 'Pendiente'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardHeader><CardTitle>Rendir números vendidos</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Participante</Label>
                <Select value={rendicionParticipanteId} onValueChange={handleRendicionParticipanteChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar participante para rendir" /></SelectTrigger>
                  <SelectContent>
                    {participantes.map((participante) => (
                      <SelectItem key={participante.id} value={participante.id}>{participante.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-brand-dark">Números asignados</p>
                    <p className="text-sm text-brand-brown">
                      {participanteRendicion
                        ? `${participanteRendicion.nombre} · ${numerosPendientesDelParticipante.length} pendientes`
                        : 'Seleccioná un participante para ver sus números.'}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs text-brand-brown">
                    <span className="rounded-full border px-2 py-1">Pendiente</span>
                    <span className="rounded-full bg-brand-creamLight px-2 py-1 opacity-70">Rendido</span>
                  </div>
                </div>
                {rendicionParticipanteId ? (
                  numerosDelParticipante.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {numerosDelParticipante.map((numero) => (
                        <Button
                          key={numero.id}
                          type="button"
                          variant={numerosSeleccionados.includes(numero.numero) ? 'default' : 'outline'}
                          className={numero.rendido ? 'cursor-not-allowed opacity-50' : undefined}
                          disabled={numero.rendido}
                          onClick={() => handleToggleNumero(numero.numero)}
                        >
                          #{numero.numero} {numero.rendido ? '· Rendido' : '· Pendiente'}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-brown">Este participante todavía no tiene números asignados.</p>
                  )
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label>{SORTEO_METODO_PAGO_LABEL.efectivo}</Label>
                  <Input type="number" value={efectivo} onChange={(event) => setEfectivo(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{SORTEO_METODO_PAGO_LABEL.transferencia}</Label>
                  <Input type="number" value={transferencia} onChange={(event) => setTransferencia(event.target.value)} />
                </div>
                <div className="rounded-lg bg-brand-creamLight p-3 text-brand-brown">
                  <p>Requerido: ${totalRequerido.toLocaleString('es-AR')}</p>
                  <p>Rendido: ${totalRendido.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <Button onClick={handleRegistrarPago} disabled={numerosSeleccionados.length === 0 || totalRendido !== totalRequerido || registrarPago.isPending}>
                Registrar rendición completa
              </Button>
              <div className="divide-y rounded-lg border">
                {pagos.map((pago) => (
                  <div key={pago.id} className="p-3 text-brand-brown">
                    <p className="font-medium text-brand-dark">${Number(pago.total_pagado).toLocaleString('es-AR')}</p>
                    <p className="text-sm">{new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ganadores">
          <Card>
            <CardHeader><CardTitle>Ganadores</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="w-fit" onClick={handleSortear} disabled={sortearGanadores.isPending}>
                <Gift className="mr-2 h-4 w-4" /> Sortear ganadores
              </Button>
              <div className="divide-y rounded-lg border">
                {ganadores.map((ganador) => (
                  <div key={ganador.id} className="flex items-center justify-between gap-3 p-3">
                    <p className="font-medium text-brand-dark">Premio {ganador.premio_orden}</p>
                    <p className="text-brand-brown">Número #{ganador.sorteo_numeros?.numero} · {ganador.sorteo_participantes?.nombre}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
