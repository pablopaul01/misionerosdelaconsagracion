ALTER TABLE public.sorteo_participantes
  ADD COLUMN IF NOT EXISTS misionero_id UUID REFERENCES public.misioneros(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sorteo_participantes'
      AND column_name = 'inscripcion_misioneros_id'
  ) THEN
    UPDATE public.sorteo_participantes sp
    SET misionero_id = irm.misionero_id
    FROM public.inscripciones_retiro_misioneros irm
    WHERE sp.registro_tipo = 'misioneros'
      AND sp.misionero_id IS NULL
      AND sp.inscripcion_misioneros_id = irm.id;
  END IF;
END;
$$;

ALTER TABLE public.sorteo_participantes
  DROP CONSTRAINT IF EXISTS sorteo_participantes_one_registration,
  DROP CONSTRAINT IF EXISTS sorteo_participantes_unique_registration;

ALTER TABLE public.sorteo_participantes
  DROP COLUMN IF EXISTS inscripcion_misioneros_id;

ALTER TABLE public.sorteo_participantes
  ADD CONSTRAINT sorteo_participantes_one_registration CHECK (
    (registro_tipo = 'conversion' AND inscripcion_conversion_id IS NOT NULL AND inscripcion_matrimonios_id IS NULL AND misionero_id IS NULL)
    OR (registro_tipo = 'matrimonios' AND inscripcion_conversion_id IS NULL AND inscripcion_matrimonios_id IS NOT NULL AND misionero_id IS NULL)
    OR (registro_tipo = 'misioneros' AND inscripcion_conversion_id IS NULL AND inscripcion_matrimonios_id IS NULL AND misionero_id IS NOT NULL)
  ),
  ADD CONSTRAINT sorteo_participantes_unique_registration UNIQUE (
    sorteo_id,
    registro_tipo,
    inscripcion_conversion_id,
    inscripcion_matrimonios_id,
    misionero_id
  );

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
    SELECT trim(nombre || ' ' || apellido), dni INTO v_nombre, v_documento
    FROM public.misioneros
    WHERE id = p_registro_id;
  ELSE
    RAISE EXCEPTION 'Tipo de registro no soportado';
  END IF;

  IF v_nombre IS NULL THEN
    RAISE EXCEPTION 'La persona no tiene un registro válido';
  END IF;

  INSERT INTO public.sorteo_participantes (
    sorteo_id,
    registro_tipo,
    inscripcion_conversion_id,
    inscripcion_matrimonios_id,
    misionero_id,
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
