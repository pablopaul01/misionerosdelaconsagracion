'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActividadCalendario } from '@/types/calendario';
import { CALENDARIO_COLORS } from '@/types/calendario';
import { CALENDARIO_ORIGEN, CALENDARIO_ORIGEN_LABEL } from '@/lib/constants/calendario';
import type { CalendarioOrigen } from '@/lib/constants/calendario';
import type { EventInput } from '@fullcalendar/core';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarioVistaProps {
  eventos: ActividadCalendario[];
  isLoading?: boolean;
  onDateClick?: (date: string) => void;
  onEventClick?: (eventId: string) => void;
}

interface DayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  eventos: ActividadCalendario[];
  onEventClick: (eventId: string) => void;
}

const getInitialView = (): string => {
  if (typeof window === 'undefined') return 'dayGridMonth';
  return window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth';
};

const getToolbarConfig = () => {
  if (typeof window === 'undefined') {
    return {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth',
    };
  }
  if (window.innerWidth < 768) {
    return {
      left: 'prev,next today',
      center: 'title',
      right: 'listMonth,dayGridMonth',
    };
  }
  if (window.innerWidth < 1024) {
    return {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth,listMonth',
    };
  }
  return {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listMonth',
  };
};

// Sheet para mostrar eventos del día seleccionado en mobile
function DayEventsSheet({ open, onOpenChange, date, eventos, onEventClick }: DayEventsSheetProps) {
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-title text-lg text-brand-dark">
            Eventos del {formattedDate}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto pb-6">
          {eventos.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-brown/70">
              No hay eventos para este día
            </p>
          ) : (
            eventos.map((evento) => {
              const colors = CALENDARIO_COLORS[evento.origen_tipo] ?? CALENDARIO_COLORS[CALENDARIO_ORIGEN.MANUAL];
              const origenLabel = CALENDARIO_ORIGEN_LABEL[evento.origen_tipo] ?? evento.origen_tipo;

              return (
                <motion.div
                  key={evento.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-l-4 border-brand-creamLight bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderLeftColor: colors.border }}
                  onClick={() => onEventClick(evento.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onEventClick(evento.id);
                    }
                  }}
                >
                  <p className="text-xs uppercase tracking-wide text-brand-brown/70">
                    {origenLabel}
                  </p>
                  <h3 className="mt-1 font-title text-base text-brand-dark">{evento.titulo}</h3>
                  <p className="mt-1 text-sm text-brand-brown">{evento.tipo}</p>
                  {evento.descripcion && (
                    <p className="mt-2 text-sm leading-relaxed text-brand-brown/80 line-clamp-2">
                      {evento.descripcion}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const transformToCalendarEvents = (actividades: ActividadCalendario[]): EventInput[] => {
  return actividades.map((actividad) => {
    const colors = CALENDARIO_COLORS[actividad.origen_tipo] ?? CALENDARIO_COLORS[CALENDARIO_ORIGEN.MANUAL];

    return {
      id: actividad.id,
      title: actividad.titulo,
      start: actividad.fecha_inicio,
      end: actividad.fecha_fin || undefined,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      allDay: false,
      extendedProps: {
        tipo: actividad.tipo,
        origen_tipo: actividad.origen_tipo,
        descripcion: actividad.descripcion,
        estado: actividad.estado,
      },
    };
  });
};

export function CalendarioVista({ eventos, isLoading, onDateClick, onEventClick }: CalendarioVistaProps) {
  const [dayEventsSheet, setDayEventsSheet] = useState<{ open: boolean; date: string; events: ActividadCalendario[] }>({
    open: false,
    date: '',
    events: [],
  });

  const calendarEvents = useMemo(() => transformToCalendarEvents(eventos), [eventos]);

  const handleDateClick = (arg: { dateStr: string }) => {
    onDateClick?.(arg.dateStr);

    // En mobile, mostrar sheet con eventos del día
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const dayStart = new Date(`${arg.dateStr}T00:00:00`);
      const dayEnd = new Date(`${arg.dateStr}T23:59:59`);

      const dayEvents = eventos.filter((evento) => {
        const eventStart = new Date(`${evento.fecha_inicio}T00:00:00`);
        const eventEnd = evento.fecha_fin ? new Date(`${evento.fecha_fin}T23:59:59`) : eventStart;
        return eventStart <= dayEnd && eventEnd >= dayStart;
      });

      setDayEventsSheet({ open: true, date: arg.dateStr, events: dayEvents });
    }
  };

  const handleEventClick = (arg: { event: { id: string } }) => {
    onEventClick?.(arg.event.id);
  };

  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      extendedProps: { tipo: string; origen_tipo: string };
      start: Date | null;
    };
  }) => {
    const formattedDate = eventInfo.event.start
      ? new Date(eventInfo.event.start).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'short',
        })
      : '';

    return (
      <motion.div
        className="calendario-event-content p-1"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.15 }}
      >
        <span className="calendario-event-title font-medium">{eventInfo.event.title}</span>
        <span className="calendario-event-meta text-xs opacity-80">
          {formattedDate} · {eventInfo.event.extendedProps.tipo}
        </span>
      </motion.div>
    );
  };

  return (
    <div className="calendario-wrapper relative">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="calendario-loading-overlay absolute inset-0 z-10 flex items-center justify-center bg-white/80"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-brown border-t-transparent" />
              <p className="text-sm text-brand-brown">Cargando calendario...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={getInitialView()}
          headerToolbar={getToolbarConfig()}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto"
          dayMaxEvents={typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : true}
          nowIndicator
          locale="es"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            list: 'Lista',
          }}
          eventDisplay="block"
          listDayFormat={{ month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' }}
          listDaySideFormat={false}
          noEventsContent={() => 'No hay actividades'}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventDidMount={(info) => {
            const origenLabel = CALENDARIO_ORIGEN_LABEL[info.event.extendedProps.origen_tipo as CalendarioOrigen] ?? info.event.extendedProps.origen_tipo;
            info.el.title = `${info.event.title}\n${info.event.extendedProps.tipo}\n${origenLabel}`;
          }}
          scrollTime="08:00:00"
        />
      </motion.div>

      {/* Sheet para eventos del día en mobile */}
      <DayEventsSheet
        open={dayEventsSheet.open}
        onOpenChange={(open) => setDayEventsSheet((prev) => ({ ...prev, open }))}
        date={dayEventsSheet.date}
        eventos={dayEventsSheet.events}
        onEventClick={(eventId) => {
          setDayEventsSheet((prev) => ({ ...prev, open: false }));
          onEventClick?.(eventId);
        }}
      />
    </div>
  );
}
