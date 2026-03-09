# Proposal: Papás de Consagración y Disertante de Lección

## Intent

Permitir asignar **misioneros responsables ("papás")** a cada formación de consagración y registrar qué **misionero dicta cada lección**. Actualmente no existe forma de saber quiénes están a cargo de una consagración ni quién dio cada clase, información crítica para reportes y seguimiento pastoral.

## Scope

### In Scope
- Crear relación muchos-a-muchos entre `formaciones_consagracion` y `misioneros` (papás)
- Agregar campo `disertante_id` (FK a misioneros) en `lecciones_consagracion`
- UI mobile-first para seleccionar papás al crear/editar formación
- UI mobile-first para seleccionar disertante al crear/editar lección
- Mostrar papás en cards de formación y disertante en headers de lección

### Out of Scope
- Historial de cambios de papás/disertantes
- Roles diferenciados entre papás (ej: principal vs. auxiliar)
- Notificaciones a los misioneros asignados
- Reportes de lecciones por disertante

## Approach

### Base de Datos
1. Nueva tabla `papas_consagracion` (junction table con FK a `formaciones_consagracion` y `misioneros`)
2. Nueva columna `disertante_id` en `lecciones_consagracion` (FK nullable a `misioneros`)

### UI (Mobile-First)
1. **Papás**: Bottom Sheet (`<Sheet side="bottom">`) con lista de misioneros, checkboxes, y búsqueda. Seleccionados se muestran como chips removibles.
2. **Disertante**: Select simple de shadcn/ui o bottom sheet picker para consistencia mobile.
3. Touch targets mínimos de 48px, thumb-zone friendly.

### Queries
- Nuevos hooks: `usePapasConsagracion`, `useAddPapa`, `useRemovePapa`
- Modificar `useAddLeccion` y `useUpdateLeccion` para incluir `disertante_id`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| **Supabase schema** | New | Tabla `papas_consagracion`, columna `disertante_id` |
| `src/types/supabase.ts` | Modified | Regenerar con `pnpm gen:types` |
| `src/lib/validations/consagracion.ts` | Modified | Agregar `disertante_id` a schema de lección |
| `src/lib/queries/consagracion.ts` | Modified | Nuevos hooks para papás, modificar mutations de lecciones |
| `src/app/(admin)/admin/consagracion/page.tsx` | Modified | Agregar selector de papás en form y mostrar en cards |
| `src/components/consagracion/AsistenciasView.tsx` | Modified | Agregar selector disertante en form, mostrar en headers |
| `src/components/ui/sheet.tsx` | Existing | Ya disponible, usar para bottom sheet |

**Route groups afectados**: `(admin)`

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multi-select complejo en mobile | Medium | Usar pattern probado de Sheet + ScrollArea + Checkbox |
| Performance con muchos misioneros | Low | Búsqueda client-side filtra lista, lazy render si necesario |
| Migración DB en producción | Low | Columnas/tablas nuevas, no rompe datos existentes |
| Regeneración de tipos incorrecta | Low | Verificar `pnpm gen:types` post-migración |

## Rollback Plan

1. **DB**:
   ```sql
   DROP TABLE IF EXISTS papas_consagracion;
   ALTER TABLE lecciones_consagracion DROP COLUMN IF EXISTS disertante_id;
   ```
2. **Código**: Revertir commits de frontend (git revert)
3. **Tipos**: Regenerar con `pnpm gen:types`

## Dependencies

- Tabla `misioneros` debe tener datos (ya existe y tiene registros)
- Componente `Sheet` de shadcn/ui (ya instalado)
- Acceso admin a Supabase para ejecutar migraciones

## Success Criteria

- [ ] Admin puede seleccionar 1+ misioneros como papás al crear formación
- [ ] Admin puede modificar papás de una formación existente
- [ ] Admin puede seleccionar disertante al crear/editar lección
- [ ] Papás se muestran en las cards de formación en `/admin/consagracion`
- [ ] Disertante se muestra en headers de lección en vista de asistencias
- [ ] UI funciona correctamente en mobile (touch-friendly, bottom sheet)
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
