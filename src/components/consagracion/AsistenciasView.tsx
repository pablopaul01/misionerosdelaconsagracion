'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useLeccionesConsagracion,
  useInscripcionesConsagracion,
  useAsistenciasConsagracion,
  useAddLeccion,
} from '@/lib/queries/consagracion';
import { leccionConsagracionSchema } from '@/lib/validations/consagracion';
import { TIPO_LECCION } from '@/lib/constants/consagracion';
import { AsistenciaToggle } from './AsistenciaToggle';
import { formatFechaCorta } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AsistenciasViewProps {
  formacionId: string;
}

const NuevaLeccionForm = ({ formacionId, proximoNumero }: { formacionId: string; proximoNumero: number }) => {
  const { mutateAsync: addLeccion } = useAddLeccion(formacionId);
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: { numero: proximoNumero, tipo: TIPO_LECCION.LECCION as 'leccion' | 'retiro', fecha: '' },
    validators: { onSubmit: leccionConsagracionSchema },
    onSubmit: async ({ value }) => {
      await addLeccion(value);
      setOpen(false);
      form.reset();
    },
  });

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-brand-brown text-brand-brown hover:bg-brand-cream"
      >
        + Agregar lección
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex gap-3 items-end bg-brand-cream p-4 rounded-lg flex-wrap"
    >
      <form.Field name="numero">
        {(field) => (
          <div className="flex flex-col gap-1.5 w-20">
            <Label>Nº</Label>
            <Input
              type="number"
              min={1}
              max={35}
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="tipo">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as 'leccion' | 'retiro')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIPO_LECCION.LECCION}>Lección</SelectItem>
                <SelectItem value={TIPO_LECCION.RETIRO}>Retiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field name="fecha">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label>Fecha (opcional)</Label>
            <Input
              type="date"
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <div className="flex gap-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting} className="bg-brand-brown text-white">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
};

export const AsistenciasView = ({ formacionId }: AsistenciasViewProps) => {
  const { data: lecciones = [] } = useLeccionesConsagracion(formacionId);
  const { data: inscripciones = [] } = useInscripcionesConsagracion(formacionId);
  const { data: asistencias = [] } = useAsistenciasConsagracion(formacionId);

  // Índice: `${leccion_id}-${inscripcion_id}` → asistencia
  const asistenciasMap = Object.fromEntries(
    asistencias.map((a) => [`${a.leccion_id}-${a.inscripcion_id}`, a]),
  );

  const proximoNumero = lecciones.length + 1;

  return (
    <div className="flex flex-col gap-4">
      <NuevaLeccionForm formacionId={formacionId} proximoNumero={proximoNumero} />

      {lecciones.length === 0 || inscripciones.length === 0 ? (
        <p className="text-brand-brown text-sm">
          {lecciones.length === 0 ? 'No hay lecciones creadas aún.' : 'No hay inscriptos aún.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-creamLight">
          <table className="text-sm min-w-max">
            <thead className="bg-brand-creamLight">
              <tr>
                <th className="px-4 py-3 text-left font-title text-brand-dark sticky left-0 bg-brand-creamLight">
                  Participante
                </th>
                {lecciones.map((leccion) => (
                  <th key={leccion.id} className="px-2 py-3 text-center font-title text-brand-dark min-w-[60px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>{leccion.tipo === TIPO_LECCION.RETIRO ? 'R' : ''}{leccion.numero}</span>
                      {leccion.tipo === TIPO_LECCION.RETIRO && (
                        <Badge className="bg-brand-gold text-brand-dark text-xs px-1">Retiro</Badge>
                      )}
                      {leccion.fecha && (
                        <span className="text-xs font-normal text-brand-brown">{formatFechaCorta(leccion.fecha)}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((insc) => {
                const asistioCount = lecciones.filter(
                  (l) => asistenciasMap[`${l.id}-${insc.id}`]?.asistio === true,
                ).length;

                return (
                  <tr key={insc.id} className="border-t border-brand-creamLight hover:bg-brand-cream/30">
                    <td className="px-4 py-2 sticky left-0 bg-white font-medium text-brand-dark">
                      <div>{insc.apellido}, {insc.nombre}</div>
                      <div className="text-xs text-brand-brown">{asistioCount}/{lecciones.length}</div>
                    </td>
                    {lecciones.map((leccion) => {
                      const reg = asistenciasMap[`${leccion.id}-${insc.id}`];
                      return (
                        <td key={leccion.id} className="px-2 py-2 text-center">
                          <AsistenciaToggle
                            formacionId={formacionId}
                            leccionId={leccion.id}
                            inscripcionId={insc.id}
                            asistenciaId={reg?.id}
                            asistio={reg?.asistio}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
