# Tasks: Módulo de Retiros

## Phase 1: Infraestructura (Base de Datos y Tipos)

- [ ] 1.1 Ejecutar SQL en Supabase: crear tipos ENUM (`tipo_retiro`, `estado_relacion`, `metodo_pago`)
- [ ] 1.2 Ejecutar SQL en Supabase: crear tabla `retiros` con campos base
- [ ] 1.3 Ejecutar SQL en Supabase: crear tabla `inscripciones_retiro_conversion` con constraint JSONB
- [ ] 1.4 Ejecutar SQL en Supabase: crear tabla `inscripciones_retiro_matrimonios`
- [ ] 1.5 Ejecutar SQL en Supabase: crear tabla `inscripciones_retiro_misioneros` con FK a `misioneros`
- [ ] 1.6 Ejecutar SQL en Supabase: crear tabla `roles_servidor_retiro` con datos iniciales
- [ ] 1.7 Ejecutar SQL en Supabase: crear tabla `servidores_retiro` con FK a roles
- [ ] 1.8 Ejecutar SQL en Supabase: crear tabla `pagos_retiro` con índice
- [ ] 1.9 Ejecutar SQL en Supabase: crear tabla `compras_retiro`
- [ ] 1.10 Ejecutar SQL en Supabase: crear triggers para cupos (conversión y matrimonios)
- [ ] 1.11 Ejecutar SQL en Supabase: crear RLS policies para todas las tablas
- [ ] 1.12 Ejecutar SQL en Supabase: crear bucket `retiros` en Storage con policies
- [ ] 1.13 Regenerar tipos TypeScript: `pnpm gen:types` (o agregar manualmente a `src/types/supabase.ts`)
- [x] 1.14 Crear `src/lib/constants/retiros.ts` con TIPO_RETIRO, ESTADO_RELACION, METODO_PAGO, labels
- [x] 1.15 Crear `src/lib/validations/retiros.ts` con schemas Zod y FIELDS arrays

## Phase 2: Query Hooks

- [x] 2.1 Crear `src/lib/queries/retiros.ts` con QUERY_KEYS
- [x] 2.2 Agregar hooks `useRetiros()`, `useRetiro(id)`, `useRetiroPublico(id)`
- [x] 2.3 Agregar hooks `useCreateRetiro()`, `useUpdateRetiro()`, `useDeleteRetiro()`
- [x] 2.4 Agregar hooks `useInscripcionesConversion(retiroId)`, `useCreateInscripcionConversion(retiroId)`
- [x] 2.5 Agregar hooks `useInscripcionesMatrimonios(retiroId)`, `useCreateInscripcionMatrimonios(retiroId)`
- [x] 2.6 Agregar hooks `useInscripcionesMisioneros(retiroId)`, `useCreateInscripcionMisionero(retiroId)`
- [x] 2.7 Agregar hooks `usePagosRetiro(retiroId)`, `useCreatePago(retiroId)`, `useDeletePago()`
- [x] 2.8 Agregar hooks `useRolesServidor()`, `useCreateRol()`, `useUpdateRol()`, `useDeleteRol()`
- [x] 2.9 Agregar hooks `useServidoresRetiro(retiroId)`, `useAddServidor()`, `useRemoveServidor()`
- [x] 2.10 Agregar hooks `useComprasRetiro(retiroId)`, `useCreateCompra()`, `useUpdateCompra()`, `useDeleteCompra()`
- [x] 2.11 Agregar hook `useCambiarEstadoEspera(retiroId)` para pasar de espera a inscrito
- [x] 2.12 Agregar hook `useUploadImagenRetiro()` para subir a Supabase Storage

## Phase 3: Componentes Base (Mobile-First)

- [ ] 3.1 Crear `src/components/retiros/FormSection.tsx` — sección colapsable con indicador de progreso
- [ ] 3.2 Crear `src/components/retiros/ContactosEmergenciaInput.tsx` — widget para 3 contactos (min-h 48px por fila)
- [ ] 3.3 Crear `src/components/retiros/ImageUpload.tsx` — subida de imagen a Storage con preview
- [ ] 3.4 Crear `src/components/retiros/RetiroCard.tsx` — card de retiro (imagen, fechas, lugar, cupos)

## Phase 4: Formularios Públicos (Inscripciones)

- [ ] 4.1 Crear `src/components/retiros/ConversionForm.tsx` — formulario con secciones colapsables
- [ ] 4.2 En ConversionForm: implementar sección 1 (datos personales)
- [ ] 4.3 En ConversionForm: implementar sección 2 (contactos emergencia con widget)
- [ ] 4.4 En ConversionForm: implementar sección 3 (salud con campos condicionales)
- [ ] 4.5 En ConversionForm: implementar sección 4 (info retiro)
- [ ] 4.6 En ConversionForm: agregar dialog de confirmación antes de submit
- [ ] 4.7 En ConversionForm: mostrar mensaje si queda en lista de espera
- [ ] 4.8 Crear `src/components/retiros/MatrimoniosForm.tsx` — formulario para parejas
- [ ] 4.9 En MatrimoniosForm: implementar sección esposo
- [ ] 4.10 En MatrimoniosForm: implementar sección esposa
- [ ] 4.11 En MatrimoniosForm: implementar sección pareja (estado relación, domicilio, cómo se enteraron)
- [ ] 4.12 En MatrimoniosForm: agregar dialog de confirmación y mensaje lista de espera
- [ ] 4.13 Crear `src/components/retiros/MisioneroLookupForm.tsx` — lookup por DNI con confirmación

## Phase 5: Rutas Públicas

- [ ] 5.1 Crear `src/app/(public)/retiros/page.tsx` — landing con lista de retiros activos (cards)
- [ ] 5.2 Crear `src/app/(public)/retiros/[id]/inscripcion/conversion/page.tsx` — página de inscripción conversión
- [ ] 5.3 Crear `src/app/(public)/retiros/[id]/inscripcion/matrimonios/page.tsx` — página de inscripción matrimonios
- [ ] 5.4 Crear `src/app/(public)/retiros/[id]/inscripcion/misioneros/page.tsx` — página de inscripción misioneros

## Phase 6: Componentes Admin

- [ ] 6.1 Crear `src/components/retiros/NuevoRetiroForm.tsx` — formulario crear/editar retiro con ImageUpload
- [ ] 6.2 Crear `src/components/retiros/ParticipantesView.tsx` — tabla desktop / cards mobile con estado pago
- [ ] 6.3 En ParticipantesView: agregar filtro por estado (todos/inscriptos/en espera)
- [ ] 6.4 En ParticipantesView: agregar acción para cambiar estado de espera a inscrito
- [ ] 6.5 En ParticipantesView: agregar dialog/sheet para editar participante
- [ ] 6.6 Crear `src/components/retiros/PagosSheet.tsx` — bottom sheet (mobile) / dialog (desktop) para pagos
- [ ] 6.7 En PagosSheet: mostrar historial de pagos del participante
- [ ] 6.8 En PagosSheet: form para agregar nuevo pago (monto, método, fecha)
- [ ] 6.9 En PagosSheet: mostrar total pagado vs costo del retiro
- [ ] 6.10 Crear `src/components/retiros/RolesServidorView.tsx` — CRUD de roles (tabla simple)
- [ ] 6.11 Crear `src/components/retiros/ServidoresView.tsx` — asignar misioneros como servidores con rol
- [ ] 6.12 En ServidoresView: usar MisioneroSelect existente + select de rol
- [ ] 6.13 Crear `src/components/retiros/ComprasView.tsx` — lista de compras con checkbox "comprado"
- [ ] 6.14 En ComprasView: form inline para agregar compra (concepto, cantidad, unidad, costo)
- [ ] 6.15 Crear `src/components/retiros/EntrevistaSheet.tsx` — marcar entrevista realizada (solo matrimonios)

## Phase 7: Rutas Admin

- [ ] 7.1 Crear `src/app/(admin)/admin/retiros/page.tsx` — lista de retiros + botón crear nuevo
- [ ] 7.2 En página retiros: mostrar cards con info resumida (tipo, fechas, inscriptos/cupo)
- [ ] 7.3 En página retiros: agregar filtro por tipo de retiro
- [ ] 7.4 Crear `src/app/(admin)/admin/retiros/[id]/page.tsx` — detalle retiro con tabs/navegación
- [ ] 7.5 Crear `src/app/(admin)/admin/retiros/[id]/participantes/page.tsx` — CRUD participantes
- [ ] 7.6 Crear `src/app/(admin)/admin/retiros/[id]/pagos/page.tsx` — gestión de pagos por participante
- [ ] 7.7 Crear `src/app/(admin)/admin/retiros/[id]/servidores/page.tsx` — asignación de servidores
- [ ] 7.8 Crear `src/app/(admin)/admin/retiros/[id]/compras/page.tsx` — lista de compras
- [ ] 7.9 Crear `src/app/(admin)/admin/retiros/roles/page.tsx` — CRUD roles de servidor
- [ ] 7.10 Modificar `src/components/shared/AdminSidebar.tsx`: agregar item "Retiros" a NAV_ITEMS

## Phase 8: Verificación

- [ ] 8.1 Ejecutar `pnpm lint` y corregir errores
- [ ] 8.2 Ejecutar `pnpm build` y verificar compilación exitosa
- [ ] 8.3 Test manual: crear retiro de conversión con imagen, cupo y costo
- [ ] 8.4 Test manual: inscribirse públicamente → verificar trigger de cupo
- [ ] 8.5 Test manual: inscribirse cuando cupo lleno → verificar lista de espera
- [ ] 8.6 Test manual: admin cambia de lista de espera a inscrito
- [ ] 8.7 Test manual: registrar pago parcial y verificar estado
- [ ] 8.8 Test manual: crear retiro de matrimonios y pre-inscribir pareja
- [ ] 8.9 Test manual: marcar entrevista realizada
- [ ] 8.10 Test manual: crear retiro de misioneros y lookup por DNI
- [ ] 8.11 Test manual: asignar servidores con diferentes roles
- [ ] 8.12 Test manual: CRUD roles de servidor
- [ ] 8.13 Test manual: agregar compras y marcar como comprado
- [ ] 8.14 Test manual mobile (375px): formulario conversión con secciones colapsables
- [ ] 8.15 Test manual mobile (375px): bottom sheets para pagos y edición
- [ ] 8.16 Test manual mobile (375px): touch targets mínimo 48px en toda la UI
