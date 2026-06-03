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

  SELECT s.numero_desde, s.numero_hasta
  INTO v_numero_desde, v_numero_hasta
  FROM public.sorteos s
  WHERE s.id = p_sorteo_id
  FOR UPDATE;

  IF v_numero_desde IS NULL THEN
    RAISE EXCEPTION 'El sorteo no existe';
  END IF;

  SELECT COALESCE(max(sn.numero), v_numero_desde - 1) + 1
  INTO v_inicio
  FROM public.sorteo_numeros sn
  WHERE sn.sorteo_id = p_sorteo_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sorteo_participantes sp
    WHERE sp.id = p_participante_id
      AND sp.sorteo_id = p_sorteo_id
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
  RETURNING public.sorteo_numeros.id, public.sorteo_numeros.numero;
END;
$$;
