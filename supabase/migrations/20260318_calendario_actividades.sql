create table if not exists public.calendario_actividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text not null,
  estado text not null default 'activo' check (estado in ('activo', 'cancelado')),
  fecha_inicio date not null,
  fecha_fin date,
  origen_tipo text not null check (
    origen_tipo in (
      'manual',
      'consagracion_formacion',
      'consagracion_retiro',
      'retiro',
      'formacion_misioneros'
    )
  ),
  origen_id text,
  origen_updated_at timestamptz,
  dedupe_key text,
  sincronizado boolean not null default false,
  nota_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists calendario_actividades_dedupe_key_uniq
  on public.calendario_actividades (dedupe_key)
  where dedupe_key is not null;

create index if not exists calendario_actividades_fecha_origen_idx
  on public.calendario_actividades (fecha_inicio, origen_tipo);

create index if not exists calendario_actividades_origen_idx
  on public.calendario_actividades (origen_tipo, origen_id);

create or replace function public.update_updated_at_calendario_actividades()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_update_calendario_actividades_updated_at on public.calendario_actividades;

create trigger trg_update_calendario_actividades_updated_at
before update on public.calendario_actividades
for each row
execute function public.update_updated_at_calendario_actividades();
