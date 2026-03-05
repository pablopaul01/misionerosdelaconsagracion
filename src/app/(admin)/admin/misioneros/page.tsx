'use client';

import { useState } from 'react';
import { MisioneroTable } from '@/components/misioneros/MisioneroTable';
import { MisioneroForm } from '@/components/misioneros/MisioneroForm';
import { useCreateMisionero } from '@/lib/queries/misioneros';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MisionerosPage() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createMisionero } = useCreateMisionero();

  const handleSubmit = async (value: Parameters<typeof createMisionero>[0]) => {
    await createMisionero(value);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-title text-2xl text-brand-dark">Misioneros</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-dark text-white">
              + Nuevo misionero
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-title text-brand-dark">Registrar misionero</DialogTitle>
            </DialogHeader>
            <MisioneroForm onSubmit={handleSubmit} submitLabel="Registrar" />
          </DialogContent>
        </Dialog>
      </div>

      <MisioneroTable />
    </div>
  );
}
