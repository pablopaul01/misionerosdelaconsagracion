# Tasks: Papás de Consagración y Disertante de Lección

## Phase 1: Infrastructure (Base de Datos y Tipos)

- [x] 1.1 Ejecutar SQL en Supabase: crear tabla `papas_consagracion` con FKs a `formaciones_consagracion` y `misioneros`, constraint UNIQUE, y RLS policy
- [x] 1.2 Ejecutar SQL en Supabase: agregar columna `disertante_id UUID REFERENCES misioneros(id) ON DELETE SET NULL` a `lecciones_consagracion`
- [x] 1.3 Regenerar tipos TypeScript ejecutando `pnpm gen:types`
- [x] 1.4 Verificar que `src/types/supabase.ts` incluye `papas_consagracion` y `disertante_id` en `lecciones_consagracion`

## Phase 2: Queries y Validaciones

- [x] 2.1 Agregar query key `papas: (formacionId: string) => ['papas-consagracion', formacionId]` en `src/lib/queries/consagracion.ts`
- [x] 2.2 Crear hook `usePapasConsagracion(formacionId)` que hace SELECT con JOIN a `misioneros`
- [x] 2.3 Crear hook `useTogglePapa(formacionId)` con mutation INSERT/DELETE según `isAdding`
- [x] 2.4 Modificar `useFormacionesConsagracion()` para incluir `papas_consagracion(*, misioneros(*))` en el SELECT
- [x] 2.5 Modificar `useLeccionesConsagracion(formacionId)` para incluir `misioneros!disertante_id(*)` en el SELECT
- [x] 2.6 Modificar `useAddLeccion(formacionId)` para aceptar `disertante_id` opcional en el input
- [x] 2.7 Modificar `useUpdateLeccion(formacionId)` para aceptar `disertante_id` en el update
- [x] 2.8 Agregar `disertante_id: z.string()` a `leccionConsagracionSchema` en `src/lib/validations/consagracion.ts`

## Phase 3: Componentes UI

- [x] 3.1 Crear `src/components/consagracion/MisioneroSelect.tsx` — Select con lista de misioneros, opción "Sin asignar", usando `useMisioneros()`
- [x] 3.2 Crear `src/components/consagracion/PapasSheet.tsx` — Bottom sheet (`side="bottom"`) con búsqueda, lista de misioneros con checkboxes (min-h 48px), botón "Listo"
- [x] 3.3 En `PapasSheet`: implementar filtro client-side por apellido/nombre
- [x] 3.4 En `PapasSheet`: usar `useTogglePapa` para INSERT/DELETE al hacer click en cada fila

## Phase 4: Integración — Página Consagración

- [x] 4.1 En `src/app/(admin)/admin/consagracion/page.tsx`: agregar estado `papasSheetOpen` y `selectedFormacionId`
- [x] 4.2 En cada card de formación: mostrar badges con nombres de papás (máx 2 visibles + "+N" overflow)
- [x] 4.3 En cada card de formación: agregar botón "Editar papás" que abre `PapasSheet`
- [x] 4.4 Importar y renderizar `PapasSheet` pasando `formacionId`, `open`, `onOpenChange`

## Phase 5: Integración — Vista Asistencias

- [x] 5.1 En `NuevaLeccionForm` en `src/components/consagracion/AsistenciasView.tsx`: agregar campo `disertante_id` al `defaultValues` del form
- [x] 5.2 En `NuevaLeccionForm`: importar y usar `MisioneroSelect` para el campo disertante (full-width en mobile)
- [x] 5.3 En la tabla desktop de asistencias: agregar fila en el header de cada lección mostrando nombre/iniciales del disertante
- [x] 5.4 En el selector mobile "por-leccion": mostrar disertante junto al número de lección
- [x] 5.5 Agregar funcionalidad para editar disertante de lección existente (inline o modal)

## Phase 6: Verificación

- [x] 6.1 Ejecutar `pnpm lint` y corregir errores
- [x] 6.2 Ejecutar `pnpm build` y verificar compilación exitosa
- [ ] 6.3 Test manual: crear formación → agregar 2+ papás → verificar badges en card
- [ ] 6.4 Test manual: quitar papá → verificar actualización inmediata
- [ ] 6.5 Test manual: crear lección con disertante → verificar en header tabla
- [ ] 6.6 Test manual: editar lección existente → cambiar disertante → verificar
- [ ] 6.7 Test manual mobile (375px): verificar bottom sheet, touch targets 48px, scroll
