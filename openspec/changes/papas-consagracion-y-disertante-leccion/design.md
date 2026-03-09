# Design: Papás de Consagración y Disertante de Lección

## Technical Approach

Implementar dos relaciones nuevas en la base de datos:
1. **Papás de consagración**: Relación muchos-a-muchos usando tabla junction `papas_consagracion`
2. **Disertante de lección**: FK simple `disertante_id` en `lecciones_consagracion`

UI mobile-first usando componentes existentes de shadcn/ui (`Sheet`, `Select`, `Checkbox`, `Badge`).

## Architecture Decisions

### Decision 1: Junction Table vs JSON Array para Papás

**Choice**: Junction table `papas_consagracion`
**Alternatives considered**: Columna JSON `papas_ids[]` en `formaciones_consagracion`
**Rationale**:
- Integridad referencial con FKs
- Queries simples con JOINs
- Cascade delete automático
- Consistente con patrón existente (`inscripciones_misioneros`)

### Decision 2: FK Nullable vs Tabla Separada para Disertante

**Choice**: Columna `disertante_id UUID REFERENCES misioneros(id)` nullable
**Alternatives considered**: Tabla `disertantes_lecciones` (junction one-to-one)
**Rationale**:
- Relación 1:1, no necesita junction table
- Nullable permite lecciones sin disertante asignado
- Menos complejidad en queries

### Decision 3: Bottom Sheet vs Modal para Selector de Papás

**Choice**: `<Sheet side="bottom">` para mobile, mismo componente en desktop
**Alternatives considered**: `<Dialog>` modal, Popover con Command
**Rationale**:
- Sheet ya existe en el proyecto (`src/components/ui/sheet.tsx`)
- `side="bottom"` es el patrón estándar mobile para selección múltiple
- Touch-friendly por defecto (scroll nativo, área amplia)

### Decision 4: Flujo de Gestión de Papás

**Choice**: Gestión separada post-creación con botón "Editar papás"
**Alternatives considered**: Inline en formulario de creación
**Rationale**:
- El formulario de creación actual es simple (año + fecha)
- Agregar multi-select complica el flujo inicial
- Permite editar papás de formaciones existentes
- UX más clara: crear primero, asignar después

## Data Flow

### Flujo: Agregar/Quitar Papás

```
┌─────────────────────┐
│  ConsagracionPage   │
│  (card formación)   │
└──────────┬──────────┘
           │ click "Editar papás"
           ▼
┌─────────────────────┐
│  PapasSheet         │◄──── useMisioneros()
│  (bottom sheet)     │◄──── usePapasConsagracion(formacionId)
└──────────┬──────────┘
           │ toggle checkbox
           ▼
┌─────────────────────┐
│  useTogglePapa      │───► INSERT/DELETE papas_consagracion
│  (mutation)         │
└──────────┬──────────┘
           │ onSuccess
           ▼
┌─────────────────────┐
│  invalidateQueries  │───► Refetch papas + formaciones
└─────────────────────┘
```

### Flujo: Asignar Disertante a Lección

```
┌─────────────────────┐
│  NuevaLeccionForm   │◄──── useMisioneros()
│  o EditLeccionForm  │
└──────────┬──────────┘
           │ select disertante
           ▼
┌─────────────────────┐
│  useAddLeccion      │───► INSERT lecciones_consagracion
│  useUpdateLeccion   │     con disertante_id
└──────────┬──────────┘
           │ onSuccess
           ▼
┌─────────────────────┐
│  invalidateQueries  │───► Refetch lecciones (incluye disertante)
└─────────────────────┘
```

## Database Schema

### Nueva Tabla: `papas_consagracion`

```sql
CREATE TABLE papas_consagracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formacion_id UUID NOT NULL REFERENCES formaciones_consagracion(id) ON DELETE CASCADE,
  misionero_id UUID NOT NULL REFERENCES misioneros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(formacion_id, misionero_id)
);

-- RLS
ALTER TABLE papas_consagracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON papas_consagracion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Modificación: `lecciones_consagracion`

```sql
ALTER TABLE lecciones_consagracion
ADD COLUMN disertante_id UUID REFERENCES misioneros(id) ON DELETE SET NULL;
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/supabase.ts` | Regenerate | `pnpm gen:types` post-migración |
| `src/lib/validations/consagracion.ts` | Modify | Agregar `disertante_id` opcional a `leccionConsagracionSchema` |
| `src/lib/queries/consagracion.ts` | Modify | Nuevos hooks papás, modificar lecciones queries |
| `src/app/(admin)/admin/consagracion/page.tsx` | Modify | Agregar PapasSheet, mostrar papás en cards |
| `src/components/consagracion/AsistenciasView.tsx` | Modify | Agregar selector disertante, mostrar en headers |
| `src/components/consagracion/PapasSheet.tsx` | Create | Componente bottom sheet selector de papás |
| `src/components/consagracion/MisioneroSelect.tsx` | Create | Select reutilizable para disertante |

## Interfaces / Contracts

### Tipos TypeScript (post `gen:types`)

```typescript
// Esperado en src/types/supabase.ts después de migración
interface PapasConsagracion {
  Row: {
    id: string;
    formacion_id: string;
    misionero_id: string;
    created_at: string | null;
  };
  // ... Insert, Update, Relationships
}

interface LeccionesConsagracion {
  Row: {
    // ... campos existentes
    disertante_id: string | null;  // NUEVO
  };
}
```

### Nuevos Hooks

```typescript
// src/lib/queries/consagracion.ts

// Query: obtener papás de una formación con datos del misionero
export const usePapasConsagracion = (formacionId: string) => {
  return useQuery({
    queryKey: ['papas-consagracion', formacionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('papas_consagracion')
        .select('*, misioneros(*)')
        .eq('formacion_id', formacionId);
      return data;
    },
  });
};

// Mutation: agregar o quitar papá (toggle)
export const useTogglePapa = (formacionId: string) => {
  return useMutation({
    mutationFn: async ({ misioneroId, isAdding }: { misioneroId: string; isAdding: boolean }) => {
      if (isAdding) {
        await supabase.from('papas_consagracion').insert({ formacion_id: formacionId, misionero_id: misioneroId });
      } else {
        await supabase.from('papas_consagracion').delete()
          .eq('formacion_id', formacionId)
          .eq('misionero_id', misioneroId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['papas-consagracion', formacionId] }),
  });
};

// Modificar useFormacionesConsagracion para incluir papás
export const useFormacionesConsagracion = () => {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase
        .from('formaciones_consagracion')
        .select('*, papas_consagracion(*, misioneros(*))')
        .order('anio', { ascending: false });
      return data;
    },
  });
};

// Modificar useLeccionesConsagracion para incluir disertante
export const useLeccionesConsagracion = (formacionId: string) => {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase
        .from('lecciones_consagracion')
        .select('*, misioneros!disertante_id(*)')  // JOIN con alias
        .eq('formacion_id', formacionId)
        .order('numero');
      return data;
    },
  });
};
```

### Componente PapasSheet

```typescript
// src/components/consagracion/PapasSheet.tsx

interface PapasSheetProps {
  formacionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PapasSheet = ({ formacionId, open, onOpenChange }: PapasSheetProps) => {
  const { data: misioneros = [] } = useMisioneros();
  const { data: papas = [] } = usePapasConsagracion(formacionId);
  const { mutate: toggle } = useTogglePapa(formacionId);
  const [search, setSearch] = useState('');

  const papasIds = new Set(papas.map(p => p.misionero_id));
  const filtered = misioneros.filter(m =>
    `${m.apellido} ${m.nombre}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Papás de consagración</SheetTitle>
        </SheetHeader>

        <Input
          placeholder="Buscar misionero..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="my-3"
        />

        <div className="flex-1 overflow-y-auto">
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => toggle({ misioneroId: m.id, isAdding: !papasIds.has(m.id) })}
              className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] hover:bg-brand-cream/50"
            >
              <Checkbox checked={papasIds.has(m.id)} />
              <span>{m.apellido}, {m.nombre}</span>
            </button>
          ))}
        </div>

        <SheetFooter className="pt-3 border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Listo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
```

### Componente MisioneroSelect

```typescript
// src/components/consagracion/MisioneroSelect.tsx

interface MisioneroSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
}

export const MisioneroSelect = ({ value, onValueChange, placeholder = 'Sin asignar' }: MisioneroSelectProps) => {
  const { data: misioneros = [] } = useMisioneros();

  return (
    <Select value={value ?? ''} onValueChange={v => onValueChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sin asignar</SelectItem>
        {misioneros.map(m => (
          <SelectItem key={m.id} value={m.id}>
            {m.apellido}, {m.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

## UI Specifications (Mobile-First)

### Card de Formación con Papás

```
┌────────────────────────────────────────┐
│ Consagración 2025      ✓ Finalizada   │
│ Inicio: 15/02/2025                     │
│                                        │
│ Papás:                                 │
│ ┌────────┐ ┌──────────┐ ┌───┐         │
│ │J. Pérez│ │M. López  │ │+2 │         │  ← Badges, +N si hay más
│ └────────┘ └──────────┘ └───┘         │
│                                        │
│ ┌──────────┐            [Link]        │
│ │✏ Papás  │                           │  ← Botón abre PapasSheet
│ └──────────┘                           │
│ ┌────────────┐ ┌────────────┐         │
│ │Inscripciones│ │ Asistencias│         │
│ └────────────┘ └────────────┘         │
└────────────────────────────────────────┘
```

### Header de Lección con Disertante (Desktop)

```
│  1      │  2      │  R1     │
│ 12/mar  │ 19/mar  │  2/abr  │
│ J.Pérez │ M.López │   —     │  ← Nombre truncado o iniciales
│ ✕ elim. │ ✕ elim. │ ✕ elim. │
```

### Form Lección con Disertante (Mobile)

```
┌─────────────────────────────────────┐
│ Nº    │ Tipo       │ Fecha         │
│ [3]   │ [Lección▼] │ [2025-03-26]  │
├─────────────────────────────────────┤
│ Disertante                          │
│ ┌─────────────────────────────────┐ │
│ │ Juan Pérez                   ▼ │ │  ← Select full-width
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Guardar]              [Cancelar]  │
└─────────────────────────────────────┘
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Lint | Código sin errores | `pnpm lint` |
| Build | Compilación exitosa | `pnpm build` |
| Manual | Flujo papás CRUD | Crear formación → agregar papás → verificar en card |
| Manual | Flujo disertante | Crear lección con disertante → verificar en header |
| Manual | Mobile UX | Probar en viewport 375px, touch targets |

## Migration / Rollout

### Orden de Ejecución

1. **Ejecutar SQL en Supabase** (producción/staging)
   ```sql
   -- Crear tabla papas
   CREATE TABLE papas_consagracion (...);
   -- Agregar columna disertante
   ALTER TABLE lecciones_consagracion ADD COLUMN disertante_id ...;
   ```

2. **Regenerar tipos**
   ```bash
   pnpm gen:types
   ```

3. **Deploy código** (Netlify auto-deploy on push)

### Rollback SQL

```sql
DROP TABLE IF EXISTS papas_consagracion;
ALTER TABLE lecciones_consagracion DROP COLUMN IF EXISTS disertante_id;
```

## Open Questions

- [x] ¿Papás se asignan en creación o edición posterior? → **Edición posterior** (decisión tomada)
- [x] ¿Cómo mostrar muchos papás en card mobile? → **Badges con "+N" overflow**
- [ ] ¿Límite máximo de papás por formación? → Asumir sin límite por ahora
