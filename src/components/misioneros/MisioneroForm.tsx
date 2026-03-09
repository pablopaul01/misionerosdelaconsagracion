'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { misioneroSchema, type MisioneroInput } from '@/lib/validations/misioneros';
import { fieldError } from '@/lib/utils/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type RolMisionero = {
  id: string;
  nombre: string;
};

interface MisioneroFormProps {
  defaultValues?: Partial<MisioneroInput>;
  roles?: RolMisionero[];
  defaultRoleIds?: string[];
  onSubmit: (value: MisioneroInput, roleIds: string[]) => Promise<void>;
  submitLabel?: string;
}

// Campo de texto genérico reutilizable dentro del formulario
const FormField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  inputMode,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
    {error && <span className="text-sm text-red-600">{error}</span>}
  </div>
);

export const MisioneroForm = ({
  defaultValues,
  roles = [],
  defaultRoleIds = [],
  onSubmit,
  submitLabel = 'Guardar',
}: MisioneroFormProps) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(defaultRoleIds);

  useEffect(() => {
    setSelectedRoleIds(defaultRoleIds);
  }, [defaultRoleIds]);

  const form = useForm({
    defaultValues: {
      nombre:   defaultValues?.nombre   ?? '',
      apellido: defaultValues?.apellido ?? '',
      dni:      defaultValues?.dni      ?? '',
      whatsapp: defaultValues?.whatsapp ?? '',
    },
    validators: { onSubmit: misioneroSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value, selectedRoleIds);
    },
  });

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="nombre">
          {(field) => (
            <FormField
              label="Nombre"
              id="nombre"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0] ? fieldError(field.state.meta.errors[0]) : undefined}
            />
          )}
        </form.Field>

        <form.Field name="apellido">
          {(field) => (
            <FormField
              label="Apellido"
              id="apellido"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0] ? fieldError(field.state.meta.errors[0]) : undefined}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="dni">
        {(field) => (
          <FormField
            label="DNI"
            id="dni"
            inputMode="numeric"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0] ? fieldError(field.state.meta.errors[0]) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="whatsapp">
        {(field) => (
          <FormField
            label="WhatsApp (sin +, solo números)"
            id="whatsapp"
            inputMode="numeric"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0] ? fieldError(field.state.meta.errors[0]) : undefined}
          />
        )}
      </form.Field>

      <div className="flex flex-col gap-2">
        <Label>Roles</Label>
        {roles.length === 0 ? (
          <p className="text-sm text-brand-brown">No hay roles disponibles</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                {role.nombre}
              </label>
            ))}
          </div>
        )}
      </div>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white mt-2"
          >
            {isSubmitting ? 'Guardando...' : submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};
