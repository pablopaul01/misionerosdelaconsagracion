CREATE TABLE IF NOT EXISTS public.sorteos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado', 'cancelado')),
  costo_numero NUMERIC(12, 2) NOT NULL CHECK (costo_numero > 0),
  cantidad_premios INTEGER NOT NULL CHECK (cantidad_premios > 0),
  numero_desde INTEGER NOT NULL DEFAULT 1 CHECK (numero_desde > 0),
  numero_hasta INTEGER CHECK (numero_hasta IS NULL OR numero_hasta >= numero_desde),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sorteo_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES public.sorteos(id) ON DELETE CASCADE,
  registro_tipo TEXT NOT NULL CHECK (registro_tipo IN ('conversion', 'matrimonios', 'misioneros')),
  inscripcion_conversion_id UUID REFERENCES public.inscripciones_retiro_conversion(id),
  inscripcion_matrimonios_id UUID REFERENCES public.inscripciones_retiro_matrimonios(id),
  inscripcion_misioneros_id UUID REFERENCES public.inscripciones_retiro_misioneros(id),
  nombre TEXT NOT NULL,
  documento TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sorteo_participantes_one_registration CHECK (
    (registro_tipo = 'conversion' AND inscripcion_conversion_id IS NOT NULL AND inscripcion_matrimonios_id IS NULL AND inscripcion_misioneros_id IS NULL)
    OR (registro_tipo = 'matrimonios' AND inscripcion_conversion_id IS NULL AND inscripcion_matrimonios_id IS NOT NULL AND inscripcion_misioneros_id IS NULL)
    OR (registro_tipo = 'misioneros' AND inscripcion_conversion_id IS NULL AND inscripcion_matrimonios_id IS NULL AND inscripcion_misioneros_id IS NOT NULL)
  ),
  CONSTRAINT sorteo_participantes_unique_registration UNIQUE (
    sorteo_id,
    registro_tipo,
    inscripcion_conversion_id,
    inscripcion_matrimonios_id,
    inscripcion_misioneros_id
  )
);

CREATE TABLE IF NOT EXISTS public.sorteo_numeros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES public.sorteos(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.sorteo_participantes(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero > 0),
  rendido BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sorteo_id, numero)
);

CREATE TABLE IF NOT EXISTS public.sorteo_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES public.sorteos(id) ON DELETE CASCADE,
  total_requerido NUMERIC(12, 2) NOT NULL CHECK (total_requerido > 0),
  total_pagado NUMERIC(12, 2) NOT NULL CHECK (total_pagado > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total_requerido = total_pagado)
);

CREATE TABLE IF NOT EXISTS public.sorteo_pago_metodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL REFERENCES public.sorteo_pagos(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('efectivo', 'transferencia')),
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sorteo_pago_numeros (
  pago_id UUID NOT NULL REFERENCES public.sorteo_pagos(id) ON DELETE CASCADE,
  numero_id UUID NOT NULL REFERENCES public.sorteo_numeros(id) ON DELETE RESTRICT,
  PRIMARY KEY (pago_id, numero_id),
  UNIQUE (numero_id)
);

CREATE TABLE IF NOT EXISTS public.sorteo_ganadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id UUID NOT NULL REFERENCES public.sorteos(id) ON DELETE CASCADE,
  numero_id UUID NOT NULL REFERENCES public.sorteo_numeros(id) ON DELETE RESTRICT,
  participante_id UUID NOT NULL REFERENCES public.sorteo_participantes(id) ON DELETE RESTRICT,
  premio_orden INTEGER NOT NULL CHECK (premio_orden > 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sorteo_id, premio_orden),
  UNIQUE (sorteo_id, numero_id)
);

CREATE INDEX IF NOT EXISTS idx_sorteo_participantes_sorteo ON public.sorteo_participantes(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_sorteo_numeros_sorteo ON public.sorteo_numeros(sorteo_id, numero);
CREATE INDEX IF NOT EXISTS idx_sorteo_pagos_sorteo ON public.sorteo_pagos(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_sorteo_ganadores_sorteo ON public.sorteo_ganadores(sorteo_id, premio_orden);

CREATE OR REPLACE FUNCTION public.user_is_sorteos_operator()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'retiro')
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_sorteos_operator()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_is_sorteos_operator() THEN
    RAISE EXCEPTION 'Sin permisos para operar sorteos';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.agregar_participante_sorteo(
  p_sorteo_id UUID,
  p_registro_tipo TEXT,
  p_registro_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participante_id UUID;
  v_nombre TEXT;
  v_documento TEXT;
BEGIN
  PERFORM public.assert_sorteos_operator();

  IF NOT EXISTS (SELECT 1 FROM public.sorteos WHERE id = p_sorteo_id) THEN
    RAISE EXCEPTION 'El sorteo no existe';
  END IF;

  IF p_registro_tipo = 'conversion' THEN
    SELECT trim(nombre || ' ' || apellido), dni INTO v_nombre, v_documento
    FROM public.inscripciones_retiro_conversion
    WHERE id = p_registro_id;
  ELSIF p_registro_tipo = 'matrimonios' THEN
    SELECT trim(nombre_esposo || ' ' || apellido_esposo || ' / ' || nombre_esposa || ' ' || apellido_esposa), dni_esposo INTO v_nombre, v_documento
    FROM public.inscripciones_retiro_matrimonios
    WHERE id = p_registro_id;
  ELSIF p_registro_tipo = 'misioneros' THEN
    SELECT trim(m.nombre || ' ' || m.apellido), m.dni INTO v_nombre, v_documento
    FROM public.inscripciones_retiro_misioneros irm
    JOIN public.misioneros m ON m.id = irm.misionero_id
    WHERE irm.id = p_registro_id;
  ELSE
    RAISE EXCEPTION 'Tipo de registro no soportado';
  END IF;

  IF v_nombre IS NULL THEN
    RAISE EXCEPTION 'La persona no tiene una inscripción registrada';
  END IF;

  INSERT INTO public.sorteo_participantes (
    sorteo_id,
    registro_tipo,
    inscripcion_conversion_id,
    inscripcion_matrimonios_id,
    inscripcion_misioneros_id,
    nombre,
    documento,
    created_by
  ) VALUES (
    p_sorteo_id,
    p_registro_tipo,
    CASE WHEN p_registro_tipo = 'conversion' THEN p_registro_id END,
    CASE WHEN p_registro_tipo = 'matrimonios' THEN p_registro_id END,
    CASE WHEN p_registro_tipo = 'misioneros' THEN p_registro_id END,
    v_nombre,
    v_documento,
    auth.uid()
  )
  RETURNING id INTO v_participante_id;

  RETURN v_participante_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.asignar_numeros_sorteo(
  p_sorteo_id UUID,
  p_participante_id UUID,
  p_cantidad INTEGER
)
RETURNS TABLE (id UUID, numero INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio INTEGER;
  v_fin INTEGER;
  v_numero_desde INTEGER;
  v_numero_hasta INTEGER;
BEGIN
  PERFORM public.assert_sorteos_operator();

  IF p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser positiva';
  END IF;

  SELECT numero_desde, numero_hasta
  INTO v_numero_desde, v_numero_hasta
  FROM public.sorteos
  WHERE id = p_sorteo_id
  FOR UPDATE;

  IF v_numero_desde IS NULL THEN
    RAISE EXCEPTION 'El sorteo no existe';
  END IF;

  SELECT COALESCE(max(numero), v_numero_desde - 1) + 1
  INTO v_inicio
  FROM public.sorteo_numeros
  WHERE sorteo_id = p_sorteo_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.sorteo_participantes
    WHERE id = p_participante_id AND sorteo_id = p_sorteo_id
  ) THEN
    RAISE EXCEPTION 'Participante no registrado en el sorteo';
  END IF;

  v_fin := v_inicio + p_cantidad - 1;
  IF v_numero_hasta IS NOT NULL AND v_fin > v_numero_hasta THEN
    RAISE EXCEPTION 'La asignación excede el rango disponible';
  END IF;

  RETURN QUERY
  INSERT INTO public.sorteo_numeros (sorteo_id, participante_id, numero, created_by)
  SELECT p_sorteo_id, p_participante_id, generate_series(v_inicio, v_fin), auth.uid()
  RETURNING sorteo_numeros.id, sorteo_numeros.numero;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_pago_sorteo(
  p_sorteo_id UUID,
  p_numeros INTEGER[],
  p_metodos JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_costo NUMERIC(12, 2);
  v_cantidad INTEGER;
  v_total_requerido NUMERIC(12, 2);
  v_total_pagado NUMERIC(12, 2);
  v_pago_id UUID;
BEGIN
  PERFORM public.assert_sorteos_operator();

  IF array_length(p_numeros, 1) IS NULL THEN
    RAISE EXCEPTION 'Debe seleccionar números';
  END IF;

  SELECT costo_numero INTO v_costo
  FROM public.sorteos
  WHERE id = p_sorteo_id;

  IF v_costo IS NULL THEN
    RAISE EXCEPTION 'El sorteo no existe';
  END IF;

  SELECT count(*) INTO v_cantidad
  FROM public.sorteo_numeros
  WHERE sorteo_id = p_sorteo_id
    AND numero = ANY(p_numeros)
    AND rendido = false;

  IF v_cantidad <> array_length(p_numeros, 1) THEN
    RAISE EXCEPTION 'Todos los números deben existir y estar sin rendir';
  END IF;

  SELECT COALESCE(sum((value->>'monto')::numeric), 0) INTO v_total_pagado
  FROM jsonb_array_elements(p_metodos)
  WHERE value->>'metodo' IN ('efectivo', 'transferencia')
    AND (value->>'monto')::numeric > 0;

  IF jsonb_typeof(p_metodos) <> 'array'
    OR jsonb_array_length(p_metodos) = 0
    OR v_total_pagado IS NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_metodos)
      WHERE value->>'metodo' NOT IN ('efectivo', 'transferencia')
        OR COALESCE((value->>'monto')::numeric, 0) <= 0
    ) THEN
    RAISE EXCEPTION 'Métodos de pago inválidos';
  END IF;

  v_total_requerido := v_cantidad * v_costo;
  IF v_total_pagado <> v_total_requerido THEN
    RAISE EXCEPTION 'El total rendido debe ser igual al total requerido';
  END IF;

  INSERT INTO public.sorteo_pagos (sorteo_id, total_requerido, total_pagado, created_by)
  VALUES (p_sorteo_id, v_total_requerido, v_total_pagado, auth.uid())
  RETURNING id INTO v_pago_id;

  INSERT INTO public.sorteo_pago_metodos (pago_id, metodo, monto)
  SELECT v_pago_id, value->>'metodo', (value->>'monto')::numeric
  FROM jsonb_array_elements(p_metodos);

  INSERT INTO public.sorteo_pago_numeros (pago_id, numero_id)
  SELECT v_pago_id, id
  FROM public.sorteo_numeros
  WHERE sorteo_id = p_sorteo_id
    AND numero = ANY(p_numeros);

  UPDATE public.sorteo_numeros
  SET rendido = true
  WHERE sorteo_id = p_sorteo_id
    AND numero = ANY(p_numeros);

  RETURN v_pago_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sortear_ganadores_sorteo(p_sorteo_id UUID)
RETURNS TABLE (id UUID, premio_orden INTEGER, numero INTEGER, participante_id UUID, participante_nombre TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cantidad_premios INTEGER;
BEGIN
  PERFORM public.assert_sorteos_operator();

  SELECT cantidad_premios INTO v_cantidad_premios
  FROM public.sorteos
  WHERE sorteos.id = p_sorteo_id;

  IF v_cantidad_premios IS NULL THEN
    RAISE EXCEPTION 'El sorteo no existe';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.sorteo_numeros WHERE sorteo_id = p_sorteo_id AND rendido = true) THEN
    RAISE EXCEPTION 'No hay números rendidos para sortear';
  END IF;

  DELETE FROM public.sorteo_ganadores WHERE sorteo_id = p_sorteo_id;

  RETURN QUERY
  WITH elegidos AS (
    SELECT sn.id AS numero_id, sn.numero, sn.participante_id, row_number() OVER (ORDER BY random())::integer AS orden
    FROM public.sorteo_numeros sn
    WHERE sn.sorteo_id = p_sorteo_id
      AND sn.rendido = true
    ORDER BY random()
    LIMIT v_cantidad_premios
  ), insertados AS (
    INSERT INTO public.sorteo_ganadores (sorteo_id, numero_id, participante_id, premio_orden, created_by)
    SELECT p_sorteo_id, numero_id, participante_id, orden, auth.uid()
    FROM elegidos
    RETURNING sorteo_ganadores.id, sorteo_ganadores.premio_orden, sorteo_ganadores.numero_id, sorteo_ganadores.participante_id
  )
  SELECT i.id, i.premio_orden, sn.numero, i.participante_id, sp.nombre
  FROM insertados i
  JOIN public.sorteo_numeros sn ON sn.id = i.numero_id
  JOIN public.sorteo_participantes sp ON sp.id = i.participante_id
  ORDER BY i.premio_orden;
END;
$$;

ALTER TABLE public.sorteos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_numeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_pago_metodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_pago_numeros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteo_ganadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sorteos operators manage sorteos" ON public.sorteos FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage participantes" ON public.sorteo_participantes FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage numeros" ON public.sorteo_numeros FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage pagos" ON public.sorteo_pagos FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage pago metodos" ON public.sorteo_pago_metodos FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage pago numeros" ON public.sorteo_pago_numeros FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
CREATE POLICY "sorteos operators manage ganadores" ON public.sorteo_ganadores FOR ALL USING (public.user_is_sorteos_operator()) WITH CHECK (public.user_is_sorteos_operator());
