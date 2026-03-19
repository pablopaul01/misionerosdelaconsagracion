# Migración: estado_inscripcion en inscripciones_consagracion

Ejecutar en el **SQL Editor de Supabase**:

```sql
-- 1. Agregar columna estado_inscripcion
ALTER TABLE inscripciones_consagracion
  ADD COLUMN estado_inscripcion text NOT NULL DEFAULT 'inscripto'
  CHECK (estado_inscripcion IN ('contactar', 'inscripto'));

-- 2. Hacer dni y estado_civil nullable (no son obligatorios para estado "contactar")
ALTER TABLE inscripciones_consagracion
  ALTER COLUMN dni DROP NOT NULL,
  ALTER COLUMN estado_civil DROP NOT NULL;
```

Una vez ejecutada, eliminar este archivo.
