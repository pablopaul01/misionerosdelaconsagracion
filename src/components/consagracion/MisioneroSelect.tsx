'use client';

import { useMisioneros } from '@/lib/queries/misioneros';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

interface MisioneroSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MisioneroSelect = ({
  value,
  onValueChange,
  placeholder = 'Sin asignar',
  className,
}: MisioneroSelectProps) => {
  const { data: misioneros = [] } = useMisioneros();

  const handleChange = (v: string) => {
    onValueChange(v === NONE_VALUE ? '' : v);
  };

  return (
    <Select value={value || NONE_VALUE} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Sin asignar</SelectItem>
        {misioneros.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.apellido}, {m.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
