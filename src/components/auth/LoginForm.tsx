'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations/auth';
import { USER_ROLES } from '@/lib/constants/roles';
import { fieldError } from '@/lib/utils/form';
import type { Database } from '@/types/supabase';

type ProfileRole = Database['public']['Tables']['profiles']['Row']['role'];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginForm = () => {
  const router = useRouter();
  const supabase = createClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);

      const { error } = await supabase.auth.signInWithPassword(value);

      if (error) {
        setErrorMsg('Email o contraseña incorrectos');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .single();

      const role = (data as { role: ProfileRole } | null)?.role;

      if (role === USER_ROLES.ADMIN) {
        router.push('/admin/dashboard');
      } else {
        router.push('/secretario/inscripciones');
      }

      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-5"
    >
      <form.Field name="email">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">
                {fieldError(field.state.meta.errors[0])}
              </span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors[0] && (
              <span className="text-sm text-red-600">
                {fieldError(field.state.meta.errors[0])}
              </span>
            )}
          </div>
        )}
      </form.Field>

      {errorMsg && (
        <p className="text-sm text-red-600 text-center">{errorMsg}</p>
      )}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-brown hover:bg-brand-dark text-white font-title tracking-wide"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Ingresando...
              </span>
            ) : 'Ingresar'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};
