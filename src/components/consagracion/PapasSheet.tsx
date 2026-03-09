'use client';

import { useState } from 'react';
import { useMisioneros } from '@/lib/queries/misioneros';
import { usePapasConsagracion, useTogglePapa } from '@/lib/queries/consagracion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

interface PapasSheetProps {
  formacionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PapasSheet = ({ formacionId, open, onOpenChange }: PapasSheetProps) => {
  const { data: misioneros = [] } = useMisioneros();
  const { data: papas = [] } = usePapasConsagracion(formacionId);
  const { mutate: toggle, isPending } = useTogglePapa(formacionId);
  const [search, setSearch] = useState('');

  const papasIds = new Set(papas.map((p) => p.misionero_id));

  const filtered = misioneros.filter((m) =>
    `${m.apellido} ${m.nombre}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (misioneroId: string) => {
    toggle({ misioneroId, isAdding: !papasIds.has(misioneroId) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-title text-brand-dark">Papás de consagración</SheetTitle>
        </SheetHeader>

        <Input
          placeholder="Buscar misionero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="my-3"
        />

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-brand-brown text-center py-4">
              No se encontraron misioneros
            </p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => handleToggle(m.id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] hover:bg-brand-cream/50 rounded-lg transition-colors text-left"
              >
                <Checkbox
                  checked={papasIds.has(m.id)}
                  onCheckedChange={() => handleToggle(m.id)}
                  className="pointer-events-none"
                />
                <span className="text-brand-dark">
                  {m.apellido}, {m.nombre}
                </span>
              </button>
            ))
          )}
        </div>

        <SheetFooter className="pt-3 border-t border-brand-creamLight">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-brand-brown hover:bg-brand-dark text-white"
          >
            Listo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
