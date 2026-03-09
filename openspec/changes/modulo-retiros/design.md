# Design: Módulo de Retiros

## Technical Approach

Replicar la arquitectura del módulo Consagración aplicando **Mobile-First Design** en todos los componentes:

1. **Formularios dinámicos**: Array `FIELDS` con config de campos + componente genérico que renderiza según tipo
2. **Query hooks centralizados**: `src/lib/queries/retiros.ts` con TanStack Query v5
3. **Validaciones Zod**: Schemas separados por tipo de inscripción
4. **Bottom sheets para mobile**: Usar `<Sheet side="bottom">` para acciones y edición
5. **Touch targets mínimo 48px**: Botones, checkboxes y áreas clickeables

## Architecture Decisions

### Decision 1: Tablas separadas por tipo de inscripción

**Choice**: Crear 3 tablas separadas (`inscripciones_retiro_conversion`, `inscripciones_retiro_matrimonios`, `inscripciones_retiro_misioneros`)

**Alternatives considered**:
- Tabla única con JSONB para campos variables
- Tabla única con columnas nullable para todos los campos

**Rationale**:
- Cada tipo tiene campos muy diferentes (individual vs pareja vs lookup)
- Mejor integridad referencial con constraints específicos
- Queries más simples y tipado TypeScript más preciso
- Sigue el patrón existente (tablas separadas para cada entidad)

### Decision 2: Contactos de emergencia en JSONB

**Choice**: Campo `contactos_emergencia JSONB` con array de hasta 3 objetos

**Alternatives considered**:
- Tabla separada `contactos_emergencia_retiro` con FK
- 9 columnas separadas (nombre1, whatsapp1, relacion1, ...)

**Rationale**:
- Son datos auxiliares que no requieren queries independientes
- Simplifica el formulario (widget único)
- Validación client-side con Zod + constraint CHECK en DB
- Patrón similar al campo `sacramentos` (array) en Consagración

### Decision 3: Sistema de cupos con trigger PostgreSQL

**Choice**: Trigger `BEFORE INSERT` que setea `en_espera = true` cuando `COUNT(*) >= cupo`

**Alternatives considered**:
- Validación solo en frontend
- Stored procedure llamada manualmente
- RLS policy que rechaza inserts

**Rationale**:
- Garantiza integridad a nivel DB (no se puede bypasear)
- Transparente para el código de aplicación
- Permite registro en lista de espera (no rechaza, solo marca)
- Admin puede luego cambiar `en_espera` a `false` manualmente

### Decision 4: Formularios en pasos para mobile

**Choice**: Formularios largos divididos en secciones colapsables con indicador de progreso

**Alternatives considered**:
- Wizard multi-página
- Scroll infinito con todos los campos
- Tabs horizontales

**Rationale**:
- Mejor UX mobile: ve una sección a la vez sin perder contexto
- No requiere navegación entre páginas (mantiene estado en memoria)
- Indicador visual de progreso reduce abandono
- Patrón familiar de formularios móviles modernos

### Decision 5: Rutas con ID de retiro en lugar de año

**Choice**: `/retiros/[id]/inscripcion/conversion` en lugar de `/retiros/[anio]/...`

**Alternatives considered**:
- Usar año como en Consagración (`/consagracion/inscripcion/[anio]`)
- Usar slug descriptivo

**Rationale**:
- Puede haber múltiples retiros del mismo tipo en un año
- El ID es único y no cambia (el año es solo metadata)
- Simplifica queries (no necesita filtrar por tipo + año)

## Data Flow

### Inscripción pública (Conversión/Matrimonios)

```
Usuario (mobile)
    │
    ▼
┌─────────────────────────────────────┐
│  /retiros/[id]/inscripcion/[tipo]   │  ← Página pública
│  - Muestra info del retiro          │
│  - Renderiza formulario dinámico    │
└─────────────────────────────────────┘
    │
    │ onSubmit
    ▼
┌─────────────────────────────────────┐
│  Dialog de confirmación             │  ← Mobile-friendly
│  - Muestra resumen de datos         │
│  - Botón confirmar (48px height)    │
└─────────────────────────────────────┘
    │
    │ confirmarEnvio()
    ▼
┌─────────────────────────────────────┐
│  Supabase INSERT                    │
│  - Trigger verifica cupo            │
│  - Setea en_espera si corresponde   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Pantalla de éxito                  │
│  - Indica si quedó en espera        │
└─────────────────────────────────────┘
```

### Gestión de pagos (Admin)

```
Admin (mobile/desktop)
    │
    ▼
┌─────────────────────────────────────┐
│  /admin/retiros/[id]/pagos          │
│  - Lista participantes con estado   │
│  - Filtro: todos/pendientes/pagados │
└─────────────────────────────────────┘
    │
    │ click en participante (mobile: bottom sheet)
    ▼
┌─────────────────────────────────────┐
│  Sheet/Dialog de pagos              │
│  - Historial de pagos               │
│  - Form: monto, método, fecha       │
│  - Total pagado vs costo retiro     │
└─────────────────────────────────────┘
    │
    │ guardar pago
    ▼
┌─────────────────────────────────────┐
│  Supabase INSERT pagos_retiro       │
│  - Invalida query de participantes  │
└─────────────────────────────────────┘
```

## Database Schema

```sql
-- ============ TIPOS ============

CREATE TYPE tipo_retiro AS ENUM ('conversion', 'matrimonios', 'misioneros');
CREATE TYPE estado_relacion AS ENUM ('union_libre', 'casados', 'comprometidos', 'novios');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta');

-- ============ TABLA PRINCIPAL ============

CREATE TABLE retiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_retiro NOT NULL,
  nombre VARCHAR(255) NOT NULL,           -- "Retiro Espiritual Marzo 2025"
  descripcion TEXT,
  imagen_url TEXT,                        -- URL imagen encabezado
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  lugar VARCHAR(255) NOT NULL,
  costo DECIMAL(10, 2) DEFAULT 0,         -- 0 = gratuito
  cupo INTEGER,                           -- NULL = sin límite
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INSCRIPCIONES CONVERSIÓN ============

CREATE TABLE inscripciones_retiro_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,

  -- Datos personales
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  dni VARCHAR(8) NOT NULL,
  estado_civil VARCHAR(50),
  domicilio TEXT,
  telefono VARCHAR(20),

  -- Contactos emergencia (máx 3)
  contactos_emergencia JSONB DEFAULT '[]'::jsonb,

  -- Salud
  tiene_enfermedad BOOLEAN DEFAULT FALSE,
  enfermedad_detalle TEXT,
  tiene_dieta_especial BOOLEAN DEFAULT FALSE,
  dieta_especial_detalle TEXT,

  -- Info retiro
  primer_retiro BOOLEAN DEFAULT TRUE,
  bautizado BOOLEAN DEFAULT FALSE,

  -- Estado
  en_espera BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(retiro_id, dni)
);

-- Constraint para validar JSONB de contactos
ALTER TABLE inscripciones_retiro_conversion
ADD CONSTRAINT check_contactos_emergencia
CHECK (jsonb_array_length(contactos_emergencia) <= 3);

-- ============ INSCRIPCIONES MATRIMONIOS ============

CREATE TABLE inscripciones_retiro_matrimonios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,

  -- Esposo
  nombre_esposo VARCHAR(255) NOT NULL,
  apellido_esposo VARCHAR(255) NOT NULL,
  dni_esposo VARCHAR(8) NOT NULL,
  fecha_nacimiento_esposo DATE,
  whatsapp_esposo VARCHAR(20),

  -- Esposa
  nombre_esposa VARCHAR(255) NOT NULL,
  apellido_esposa VARCHAR(255) NOT NULL,
  dni_esposa VARCHAR(8) NOT NULL,
  fecha_nacimiento_esposa DATE,
  whatsapp_esposa VARCHAR(20),

  -- Pareja
  estado_relacion estado_relacion NOT NULL,
  domicilio TEXT,
  como_se_enteraron TEXT,

  -- Entrevista
  entrevista_realizada BOOLEAN DEFAULT FALSE,
  entrevista_fecha TIMESTAMPTZ,
  entrevista_notas TEXT,

  -- Estado
  en_espera BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(retiro_id, dni_esposo, dni_esposa)
);

-- ============ INSCRIPCIONES MISIONEROS ============

CREATE TABLE inscripciones_retiro_misioneros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,
  misionero_id UUID NOT NULL REFERENCES misioneros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(retiro_id, misionero_id)
);

-- ============ PAGOS ============

CREATE TABLE pagos_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,

  -- Referencia polimórfica
  tipo_inscripcion tipo_retiro NOT NULL,
  inscripcion_id UUID NOT NULL,           -- ID de la inscripción según tipo

  monto DECIMAL(10, 2) NOT NULL,
  metodo metodo_pago NOT NULL,
  fecha DATE NOT NULL,
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para queries por inscripción
CREATE INDEX idx_pagos_inscripcion ON pagos_retiro(tipo_inscripcion, inscripcion_id);

-- ============ ROLES DE SERVIDOR (configurables) ============

CREATE TABLE roles_servidor_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,    -- "Coordinador", "Cocina", "Música", etc.
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles iniciales
INSERT INTO roles_servidor_retiro (nombre) VALUES
  ('Coordinador'),
  ('Cocina'),
  ('Música'),
  ('Logística'),
  ('Oración');

-- ============ SERVIDORES ============

CREATE TABLE servidores_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,
  misionero_id UUID NOT NULL REFERENCES misioneros(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES roles_servidor_retiro(id) ON DELETE RESTRICT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(retiro_id, misionero_id)
);

-- ============ COMPRAS COMIDA ============

CREATE TABLE compras_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id UUID NOT NULL REFERENCES retiros(id) ON DELETE CASCADE,
  concepto VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10, 2),
  unidad VARCHAR(20),                     -- kg, litros, unidades
  costo DECIMAL(10, 2),
  comprado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TRIGGER PARA CUPOS ============

CREATE OR REPLACE FUNCTION check_cupo_retiro_conversion()
RETURNS TRIGGER AS $$
DECLARE
  v_cupo INTEGER;
  v_count INTEGER;
BEGIN
  SELECT cupo INTO v_cupo FROM retiros WHERE id = NEW.retiro_id;

  IF v_cupo IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM inscripciones_retiro_conversion
    WHERE retiro_id = NEW.retiro_id AND en_espera = FALSE;

    IF v_count >= v_cupo THEN
      NEW.en_espera := TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cupo_conversion
BEFORE INSERT ON inscripciones_retiro_conversion
FOR EACH ROW EXECUTE FUNCTION check_cupo_retiro_conversion();

-- Trigger similar para matrimonios
CREATE OR REPLACE FUNCTION check_cupo_retiro_matrimonios()
RETURNS TRIGGER AS $$
DECLARE
  v_cupo INTEGER;
  v_count INTEGER;
BEGIN
  SELECT cupo INTO v_cupo FROM retiros WHERE id = NEW.retiro_id;

  IF v_cupo IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM inscripciones_retiro_matrimonios
    WHERE retiro_id = NEW.retiro_id AND en_espera = FALSE;

    IF v_count >= v_cupo THEN
      NEW.en_espera := TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cupo_matrimonios
BEFORE INSERT ON inscripciones_retiro_matrimonios
FOR EACH ROW EXECUTE FUNCTION check_cupo_retiro_matrimonios();

-- ============ RLS POLICIES ============

ALTER TABLE retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_retiro_conversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_retiro_matrimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones_retiro_misioneros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_retiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidores_retiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_retiro ENABLE ROW LEVEL SECURITY;

-- Retiros: lectura pública (activos), escritura admin
CREATE POLICY "Retiros activos públicos" ON retiros
  FOR SELECT USING (activo = TRUE);

CREATE POLICY "Admin full access retiros" ON retiros
  FOR ALL USING (auth.role() = 'authenticated');

-- Inscripciones: insert público, resto admin
CREATE POLICY "Insert público conversión" ON inscripciones_retiro_conversion
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin full conversión" ON inscripciones_retiro_conversion
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Insert público matrimonios" ON inscripciones_retiro_matrimonios
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin full matrimonios" ON inscripciones_retiro_matrimonios
  FOR ALL USING (auth.role() = 'authenticated');

-- Misioneros solo admin (requiere lookup)
CREATE POLICY "Admin only misioneros retiro" ON inscripciones_retiro_misioneros
  FOR ALL USING (auth.role() = 'authenticated');

-- Pagos, servidores, compras: solo admin
CREATE POLICY "Admin pagos" ON pagos_retiro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin servidores" ON servidores_retiro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin compras" ON compras_retiro
  FOR ALL USING (auth.role() = 'authenticated');

-- Roles servidor: lectura pública (para formularios), escritura admin
ALTER TABLE roles_servidor_retiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles lectura pública" ON roles_servidor_retiro
  FOR SELECT USING (activo = TRUE);

CREATE POLICY "Admin roles" ON roles_servidor_retiro
  FOR ALL USING (auth.role() = 'authenticated');

-- ============ SUPABASE STORAGE ============

-- Crear bucket 'retiros' desde el dashboard de Supabase
-- Policies:
-- - SELECT: público (para mostrar imágenes en formularios)
-- - INSERT/UPDATE/DELETE: solo authenticated (admin)
```

### Supabase Storage Setup

```sql
-- Ejecutar en SQL Editor de Supabase:

-- 1. Crear bucket (o desde dashboard: Storage > New bucket > 'retiros' > Public)
INSERT INTO storage.buckets (id, name, public) VALUES ('retiros', 'retiros', true);

-- 2. Policies para el bucket
CREATE POLICY "Imágenes públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'retiros');

CREATE POLICY "Admin sube imágenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'retiros' AND auth.role() = 'authenticated');

CREATE POLICY "Admin elimina imágenes" ON storage.objects
  FOR DELETE USING (bucket_id = 'retiros' AND auth.role() = 'authenticated');
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/constants/retiros.ts` | Create | Enums: TIPO_RETIRO, ESTADO_RELACION, METODO_PAGO, ROLES_SERVIDOR |
| `src/lib/validations/retiros.ts` | Create | Schemas Zod + FIELDS arrays para formularios dinámicos |
| `src/lib/queries/retiros.ts` | Create | Hooks CRUD: useRetiros, useInscripcionesConversion, usePagos, etc. |
| `src/components/retiros/RetiroCard.tsx` | Create | Card de retiro para landing y admin |
| `src/components/retiros/ConversionForm.tsx` | Create | Formulario inscripción conversión (secciones colapsables) |
| `src/components/retiros/MatrimoniosForm.tsx` | Create | Formulario inscripción matrimonios |
| `src/components/retiros/MisioneroLookupForm.tsx` | Create | Lookup DNI para retiro misioneros |
| `src/components/retiros/ContactosEmergenciaInput.tsx` | Create | Widget para 3 contactos (JSONB) |
| `src/components/retiros/ParticipantesView.tsx` | Create | Tabla CRUD participantes (mobile: cards) |
| `src/components/retiros/PagosSheet.tsx` | Create | Bottom sheet para gestión de pagos |
| `src/components/retiros/ServidoresView.tsx` | Create | Tabla servidores con roles |
| `src/components/retiros/ComprasView.tsx` | Create | Tabla compras comida |
| `src/components/retiros/FormSection.tsx` | Create | Sección colapsable para formularios mobile |
| `src/components/retiros/ImageUpload.tsx` | Create | Subida imagen a Supabase Storage |
| `src/components/retiros/RolesServidorView.tsx` | Create | CRUD roles de servidor |
| `src/app/(public)/retiros/page.tsx` | Create | Landing pública de retiros disponibles |
| `src/app/(public)/retiros/[id]/inscripcion/conversion/page.tsx` | Create | Formulario público conversión |
| `src/app/(public)/retiros/[id]/inscripcion/matrimonios/page.tsx` | Create | Formulario público matrimonios |
| `src/app/(public)/retiros/[id]/inscripcion/misioneros/page.tsx` | Create | Lookup DNI misioneros |
| `src/app/(admin)/admin/retiros/page.tsx` | Create | Lista de retiros + crear nuevo |
| `src/app/(admin)/admin/retiros/[id]/page.tsx` | Create | Detalle retiro con tabs |
| `src/app/(admin)/admin/retiros/[id]/participantes/page.tsx` | Create | CRUD participantes |
| `src/app/(admin)/admin/retiros/[id]/pagos/page.tsx` | Create | Gestión de pagos |
| `src/app/(admin)/admin/retiros/[id]/servidores/page.tsx` | Create | Gestión de servidores |
| `src/app/(admin)/admin/retiros/[id]/compras/page.tsx` | Create | Gestión de compras |
| `src/app/(admin)/admin/retiros/roles/page.tsx` | Create | CRUD roles de servidor |
| `src/components/shared/AdminSidebar.tsx` | Modify | Agregar item "Retiros" al NAV_ITEMS |
| `src/types/supabase.ts` | Modify | Regenerar con `pnpm gen:types` tras SQL |

## Interfaces / Contracts

### Constants (`src/lib/constants/retiros.ts`)

```typescript
export const TIPO_RETIRO = {
  CONVERSION: 'conversion',
  MATRIMONIOS: 'matrimonios',
  MISIONEROS: 'misioneros',
} as const;

export type TipoRetiro = (typeof TIPO_RETIRO)[keyof typeof TIPO_RETIRO];

export const TIPO_RETIRO_LABEL: Record<TipoRetiro, string> = {
  conversion: 'Retiro de Conversión',
  matrimonios: 'Retiro de Matrimonios',
  misioneros: 'Retiro de Misioneros',
};

export const TIPO_RETIRO_PUBLICO: Record<TipoRetiro, string> = {
  conversion: 'Retiro Espiritual',
  matrimonios: 'Retiro de Matrimonios',
  misioneros: 'Retiro de Misioneros',
};

export const ESTADO_RELACION = {
  UNION_LIBRE: 'union_libre',
  CASADOS: 'casados',
  COMPROMETIDOS: 'comprometidos',
  NOVIOS: 'novios',
} as const;

export const ESTADO_RELACION_LABEL: Record<string, string> = {
  union_libre: 'Unión libre',
  casados: 'Casados',
  comprometidos: 'Comprometidos',
  novios: 'Novios',
};

export const METODO_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA: 'tarjeta',
} as const;

export const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};
```

### Validations (`src/lib/validations/retiros.ts`)

```typescript
import { z } from 'zod';

// --- Contacto de emergencia ---
export const contactoEmergenciaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  whatsapp: z.string().min(8, 'WhatsApp inválido').regex(/^\d+$/, 'Solo números'),
  relacion: z.string().min(1, 'Relación requerida'),
});

// --- Retiro base ---
export const retiroSchema = z.object({
  tipo: z.enum(['conversion', 'matrimonios', 'misioneros']),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string(),
  imagen_url: z.string(),
  fecha_inicio: z.string().min(1, 'Fecha inicio requerida'),
  fecha_fin: z.string().min(1, 'Fecha fin requerida'),
  lugar: z.string().min(1, 'Lugar requerido'),
  costo: z.number().min(0),
  cupo: z.number().int().positive().optional(),
});

// --- Inscripción Conversión ---
export const CONVERSION_FIELDS = [
  // Sección 1: Datos personales
  { name: 'nombre', label: 'Nombre', type: 'text', required: true, section: 1 },
  { name: 'apellido', label: 'Apellido', type: 'text', required: true, section: 1 },
  { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: false, section: 1 },
  { name: 'dni', label: 'DNI', type: 'tel', required: true, section: 1 },
  { name: 'estado_civil', label: 'Estado civil', type: 'select', required: false, section: 1,
    options: [
      { value: 'soltero_a', label: 'Soltero/a' },
      { value: 'casado', label: 'Casado/a' },
      { value: 'divorciado', label: 'Divorciado/a' },
      { value: 'viudo', label: 'Viudo/a' },
    ],
  },
  { name: 'domicilio', label: 'Domicilio', type: 'text', required: false, section: 1 },
  { name: 'telefono', label: 'Teléfono', type: 'tel', required: true, section: 1 },

  // Sección 2: Contactos emergencia (widget custom)
  { name: 'contactos_emergencia', label: 'Contactos de emergencia', type: 'contactos', required: true, section: 2 },

  // Sección 3: Salud
  { name: 'tiene_enfermedad', label: '¿Padece alguna enfermedad o alergia?', type: 'boolean', required: true, section: 3 },
  { name: 'enfermedad_detalle', label: 'Especificar', type: 'text', required: false, section: 3, showIf: 'tiene_enfermedad' },
  { name: 'tiene_dieta_especial', label: '¿Realiza alguna dieta especial?', type: 'boolean', required: true, section: 3 },
  { name: 'dieta_especial_detalle', label: 'Especificar', type: 'text', required: false, section: 3, showIf: 'tiene_dieta_especial' },

  // Sección 4: Info retiro
  { name: 'primer_retiro', label: '¿Es tu primer retiro?', type: 'boolean', required: true, section: 4 },
  { name: 'bautizado', label: '¿Recibiste el sacramento del Bautismo?', type: 'boolean', required: true, section: 4 },
] as const;

export const inscripcionConversionSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  fecha_nacimiento: z.string(),
  dni: z.string().min(7, 'DNI inválido').max(8, 'DNI inválido').regex(/^\d+$/, 'Solo números'),
  estado_civil: z.string(),
  domicilio: z.string(),
  telefono: z.string().min(8, 'Teléfono inválido').regex(/^\d+$/, 'Solo números'),
  contactos_emergencia: z.array(contactoEmergenciaSchema).min(1, 'Al menos 1 contacto').max(3),
  tiene_enfermedad: z.boolean(),
  enfermedad_detalle: z.string(),
  tiene_dieta_especial: z.boolean(),
  dieta_especial_detalle: z.string(),
  primer_retiro: z.boolean(),
  bautizado: z.boolean(),
});

// --- Inscripción Matrimonios ---
export const inscripcionMatrimoniosSchema = z.object({
  nombre_esposo: z.string().min(1),
  apellido_esposo: z.string().min(1),
  dni_esposo: z.string().min(7).max(8).regex(/^\d+$/),
  fecha_nacimiento_esposo: z.string(),
  whatsapp_esposo: z.string().min(8).regex(/^\d+$/),

  nombre_esposa: z.string().min(1),
  apellido_esposa: z.string().min(1),
  dni_esposa: z.string().min(7).max(8).regex(/^\d+$/),
  fecha_nacimiento_esposa: z.string(),
  whatsapp_esposa: z.string().min(8).regex(/^\d+$/),

  estado_relacion: z.enum(['union_libre', 'casados', 'comprometidos', 'novios']),
  domicilio: z.string(),
  como_se_enteraron: z.string(),
});

// --- Pago ---
export const pagoSchema = z.object({
  monto: z.number().min(0),
  metodo: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  fecha: z.string().min(1),
  notas: z.string(),
});

// --- Rol de servidor ---
export const rolServidorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string(),
});

// --- Servidor ---
export const servidorSchema = z.object({
  misionero_id: z.string().uuid(),
  rol_id: z.string().uuid(),
  notas: z.string(),
});

// --- Compra ---
export const compraSchema = z.object({
  concepto: z.string().min(1),
  cantidad: z.number().positive().optional(),
  unidad: z.string(),
  costo: z.number().min(0).optional(),
});

// Types
export type InscripcionConversionInput = z.infer<typeof inscripcionConversionSchema>;
export type InscripcionMatrimoniosInput = z.infer<typeof inscripcionMatrimoniosSchema>;
export type RetiroInput = z.infer<typeof retiroSchema>;
export type PagoInput = z.infer<typeof pagoSchema>;
export type ServidorInput = z.infer<typeof servidorSchema>;
export type CompraInput = z.infer<typeof compraSchema>;
```

### Query Hooks Pattern (`src/lib/queries/retiros.ts`)

```typescript
// Patrón: mismo estilo que consagracion.ts
const QUERY_KEYS = {
  retiros: ['retiros'] as const,
  retiro: (id: string) => ['retiro', id] as const,
  inscripcionesConversion: (retiroId: string) => ['inscripciones-conversion', retiroId] as const,
  inscripcionesMatrimonios: (retiroId: string) => ['inscripciones-matrimonios', retiroId] as const,
  inscripcionesMisioneros: (retiroId: string) => ['inscripciones-misioneros', retiroId] as const,
  pagos: (retiroId: string) => ['pagos-retiro', retiroId] as const,
  servidores: (retiroId: string) => ['servidores-retiro', retiroId] as const,
  compras: (retiroId: string) => ['compras-retiro', retiroId] as const,
};

// Hooks siguiendo patrón existente:
// - useRetiros() / useRetiro(id)
// - useCreateRetiro() / useUpdateRetiro() / useDeleteRetiro()
// - useInscripcionesConversion(retiroId) / useCreateInscripcionConversion(retiroId)
// - usePagosRetiro(retiroId) / useCreatePago(retiroId)
// - useServidoresRetiro(retiroId) / useToggleServidor(retiroId)
// - useComprasRetiro(retiroId) / useCreateCompra(retiroId)
// - useCambiarEstadoEspera(retiroId, tipoInscripcion) -- para pasar de espera a inscrito
// - useRolesServidor() / useCreateRol() / useUpdateRol() / useDeleteRol()
// - useUploadImagenRetiro() -- sube a Supabase Storage bucket 'retiros'
```

## Mobile-First Component Patterns

### FormSection (sección colapsable)

```typescript
interface FormSectionProps {
  title: string;
  sectionNumber: number;
  totalSections: number;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
  children: React.ReactNode;
}

// Renderiza:
// - Header clickeable con título + indicador (✓ o número)
// - Contenido colapsable con animación
// - Progress bar visual
```

### ParticipantesView (mobile cards, desktop table)

```typescript
// Mobile (< md):
// - Cards verticales con info resumida
// - Swipe o botón para acciones
// - Bottom sheet para detalles/edición

// Desktop (>= md):
// - Tabla con columnas
// - Acciones inline
// - Dialog para edición
```

### PagosSheet (bottom sheet mobile)

```typescript
// Siempre bottom sheet en mobile
// Dialog centrado en desktop
// Contenido:
// - Lista de pagos anteriores
// - Form inline para nuevo pago
// - Total pagado / pendiente
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validaciones Zod | Probar schemas con inputs válidos/inválidos |
| Integration | Query hooks | Mock Supabase, verificar mutations |
| E2E | Flujo inscripción | Cypress/Playwright: formulario → confirmación → DB |
| Manual | Mobile UX | DevTools 375px, touch targets, scroll |

## Migration / Rollout

1. **Crear tablas en Supabase** (SQL en dashboard o migration)
2. **Regenerar types**: `pnpm gen:types`
3. **Deploy incremental**: branch `feat/modulo-retiros`
4. **Feature flag opcional**: Variable de entorno `NEXT_PUBLIC_RETIROS_ENABLED`
5. **Rollback**: DROP tables + revert merge

## Open Questions

- [x] ~~¿Pasarelas de pago?~~ → No, solo registro interno
- [x] ~~¿Cupos aplica a matrimonios?~~ → Sí, igual que conversión
- [x] ~~¿Imagen de encabezado se sube al storage de Supabase o URL externa?~~ → Supabase Storage
- [x] ~~¿Roles de servidor son fijos o configurables por el admin?~~ → Configurables con CRUD (tabla `roles_servidor_retiro`)
- [ ] ¿Notificar al admin cuando alguien queda en lista de espera? (out of scope pero considerar para futuro)
