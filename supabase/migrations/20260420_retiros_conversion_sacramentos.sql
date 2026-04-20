ALTER TABLE public.inscripciones_retiro_conversion
ADD COLUMN IF NOT EXISTS sacramentos JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.inscripciones_retiro_conversion
SET sacramentos = '["bautismo"]'::jsonb
WHERE bautizado = TRUE
  AND COALESCE(jsonb_array_length(sacramentos), 0) = 0;
