# Proposal: Módulo de Retiros

## Intent

Los Misioneros de la Consagración organizan 3 tipos de retiros espirituales que actualmente se gestionan con Google Forms y planillas manuales. Esta falta de integración dificulta:

1. **Gestión de cupos**: No hay control automático de capacidad ni lista de espera
2. **Seguimiento de pagos**: Se registran manualmente, sin visibilidad del estado de cada participante
3. **Coordinación de servidores**: No hay asignación formal de roles ni responsabilidades
4. **Logística de comida**: Las compras se planifican sin sistema centralizado

El módulo de Retiros unificará la inscripción pública, gestión de participantes, pagos, servidores y logística en una sola plataforma integrada con el sistema existente de Misioneros.

## Scope

### In Scope

**Infraestructura:**
- Schema de base de datos con 7 tablas nuevas + triggers para cupos
- Types TypeScript generados desde Supabase
- Constants y validaciones Zod para los 3 tipos de retiro
- Query hooks TanStack Query para CRUD completo

**Retiro de Conversión (público: "Retiro Espiritual"):**
- Formulario público con imagen encabezado, fechas, lugar
- Campos: datos personales, 3 contactos emergencia, salud, sacramentos
- Sistema de cupos con lista de espera automática
- Admin: CRUD participantes, registro de pagos

**Retiro de Matrimonios:**
- Formulario de pre-inscripción por parejas
- Campos: datos esposo, datos esposa, datos pareja, estado relación
- Sistema de cupos con lista de espera automática (igual que conversión)
- Admin: CRUD parejas, registro de entrevistas, registro de pagos

**Retiro de Misioneros:**
- Formulario simplificado: lookup por DNI (misioneros ya en sistema)
- Admin: CRUD inscripciones

**Features transversales:**
- Registro interno de pagos: monto, método, fecha (sin pasarela de pago — solo registro de lo que ya pagaron)
- Asignación de servidores con roles configurables
- Registro de compras de comida (inventario)
- Vista general de retiros en admin

**Sistema de cupos (Conversión y Matrimonios):**
- Configurar cupo máximo por retiro
- Inscripciones automáticas a lista de espera cuando se completa el cupo
- Admin puede pasar de lista de espera a inscrito cuando se libera lugar

### Out of Scope

- Notificaciones por email/WhatsApp (feature futura)
- Reportes exportables a Excel (feature futura)
- App móvil nativa
- Gestión de habitaciones/alojamiento
- Certificados de participación

## Approach

Replicar los patrones exitosos del módulo de Consagración:

1. **Formularios dinámicos**: Array de configuración `FIELDS` + componente genérico
2. **Query hooks**: Un archivo `src/lib/queries/retiros.ts` con todos los hooks CRUD
3. **Validaciones**: Schemas Zod separados por tipo de inscripción
4. **Admin views**: Tablas TanStack Table + dialogs de edición
5. **Rutas**: Route groups `(public)` y `(admin)` con layouts protegidos

**Orden de implementación:**
1. Infraestructura (SQL, types, validations)
2. Retiro Conversión (más complejo → valida el patrón)
3. Retiro Matrimonios (reutiliza 80% de Conversión)
4. Retiro Misioneros (más simple)
5. Features transversales (pagos, servidores, comida)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/constants/retiros.ts` | New | Enums y constantes (tipos, roles, métodos pago) |
| `src/lib/validations/retiros.ts` | New | Schemas Zod para cada tipo de inscripción |
| `src/lib/queries/retiros.ts` | New | Hooks CRUD con TanStack Query |
| `src/components/retiros/` | New | 10+ componentes (forms, views, widgets) |
| `src/app/(public)/retiros/` | New | 3 rutas de inscripción pública |
| `src/app/(admin)/admin/retiros/` | New | 6+ rutas de administración |
| `src/components/shared/AdminSidebar.tsx` | Modified | Agregar item "Retiros" |
| `src/types/supabase.ts` | Modified | Regenerar con nuevas tablas |
| Supabase DB | New | 7 tablas + 1 trigger + RLS policies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Lógica de cupos + lista de espera (conversión y matrimonios) | Medium | Trigger PostgreSQL que setea `en_espera=true` automáticamente |
| JSONB para contactos emergencia dificulta validación | Low | Widget custom con validación client-side + constraint en DB |
| RLS compleja con múltiples tablas | Low | Políticas simples: anon lee retiros públicos, admin escribe todo |
| Formularios muy largos en mobile | Medium | Dividir en pasos/secciones con progress indicator |

## Rollback Plan

1. **SQL**: Todas las tablas nuevas tienen prefijo `retiros` o `_retiro` — DROP TABLE en orden inverso de creación
2. **Código**: Feature en branch separado (`feat/modulo-retiros`) — revertir merge si hay problemas
3. **Rutas**: Rutas nuevas no afectan las existentes — eliminar carpetas `/retiros` de ambos route groups
4. **Sidebar**: Único cambio a archivo existente — revertir línea agregada

```sql
-- Rollback SQL (ejecutar en orden)
DROP TABLE IF EXISTS compras_comida_retiro;
DROP TABLE IF EXISTS servidores_retiro;
DROP TABLE IF EXISTS pagos_retiro;
DROP TABLE IF EXISTS inscripciones_retiro_misioneros;
DROP TABLE IF EXISTS inscripciones_retiro_matrimonios;
DROP TABLE IF EXISTS inscripciones_retiro_conversion;
DROP TABLE IF EXISTS retiros;
DROP TYPE IF EXISTS tipo_retiro;
DROP TYPE IF EXISTS rol_servidor_retiro;
```

## Dependencies

- Supabase CLI o acceso al dashboard para ejecutar SQL
- Tabla `misioneros` existente (FK para servidores e inscripciones misioneros)
- shadcn/ui components ya instalados (Dialog, Table, Select, etc.)

## Success Criteria

- [ ] Formulario público de conversión funciona con cupos y lista de espera
- [ ] Formulario público de matrimonios registra parejas correctamente
- [ ] Formulario de misioneros hace lookup por DNI exitosamente
- [ ] Admin puede crear/editar/eliminar retiros de los 3 tipos
- [ ] Admin puede registrar pagos parciales o $0
- [ ] Admin puede asignar servidores con roles
- [ ] Admin puede registrar compras de comida
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm build` compila exitosamente
- [ ] Mobile-first: formularios y tablas usables en 375px
