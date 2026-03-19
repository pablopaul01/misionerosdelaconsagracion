alter table public.inscripciones_consagracion
add column estado_contacto text not null default 'pendiente',
add column observacion_contacto text;

alter table public.inscripciones_consagracion
add constraint inscripciones_consagracion_estado_contacto_check
check (estado_contacto in ('pendiente', 'contactado', 'contactado_si', 'contactado_no'));
