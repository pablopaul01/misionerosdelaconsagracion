# Plan: Misioneros de la Consagración - Aplicación Web Completa

## Contexto
Aplicación web para el movimiento católico "Misioneros de la Consagración".
Logo: `logomisioneros.png` (raíz del proyecto). Necesita gestionar dos pilares: (1) Misioneros con talleres de formación (San Lorenzo / Escuela de María) con asistencia auto-reportada, y (2) Inscripciones y asistencias a la Consagración Total. Proyecto greenfield, stack moderno.

---

## Stack Tecnológico
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Zod** (validación) + **TanStack Form** (formularios)
- **TanStack Query** (fetch/cache) + **TanStack Table** (tablas)
- **Zustand** (estado global UI y auth — sin prop drilling)
- **Supabase** (PostgreSQL + Auth email/password + RLS)
- **Netlify** + `@netlify/plugin-nextjs` (deploy)
- **Framer Motion** (animación landing)

---

## Estándares de Código

- **ES2025**: usar sintaxis moderna (optional chaining `?.`, nullish coalescing `??`, destructuring, etc.)
- **DRY**: extraer lógica repetida en hooks, funciones utilitarias o componentes reutilizables
- **Separación de responsabilidades**: lógica de negocio desacoplada del componente UI (custom hooks, query files, utils)
- **Sin magic strings/numbers**: toda constante reutilizable definida en archivos `constants/`
- **Nombres descriptivos en camelCase**: variables, funciones y props con nombres que expresen intención
- **Comentarios cortos y útiles**: solo cuando aporten valor; nunca comentar lo obvio
- **Zustand para estado complejo**: evitar prop drilling; compartir estado vía stores
- **Modularidad**: un archivo = una responsabilidad; componentes pequeños y componibles

---

## Roles de Usuario
| Rol | Acceso |
|-----|--------|
| `admin` | Todo |
| `secretario_consagracion` | Solo módulo Consagración |

---

## Identidad Visual

### Paleta de colores (Tailwind custom tokens)
| Token | Hex | Uso |
|-------|-----|-----|
| `brand-dark` | `#352213` | Textos principales, fondos oscuros |
| `brand-brown` | `#936838` | Títulos, bordes, acentos |
| `brand-cream-light` | `#f4e8b0` | Fondos claros |
| `brand-cream` | `#f7ebd9` | Fondo base de la app |
| `brand-orange` | `#e63912` | Alertas, CTAs secundarios |
| `brand-gold` | `#fbb825` | Badges, highlights |
| `brand-navy` | `#023059` | Fondos oscuros alternativos |
| `brand-teal` | `#04adbf` | Links, acciones |

### Tipografía
- **Títulos**: Trajan Pro Bold → Google Fonts alternativa: **Cinzel** (misma estética)
- **Cuerpo**: Calibri → disponible en sistema; fallback `Georgia, serif`

### Configuración Tailwind (`tailwind.config.ts`)
```ts
extend: {
  colors: {
    brand: {
      dark:        '#352213',
      brown:       '#936838',
      creamLight:  '#f4e8b0',
      cream:       '#f7ebd9',
      orange:      '#e63912',
      gold:        '#fbb825',
      navy:        '#023059',
      teal:        '#04adbf',
    }
  },
  fontFamily: {
    title: ['Cinzel', 'serif'],
    body:  ['Calibri', 'Georgia', 'serif'],
  }
}
```

---

## Schema de Base de Datos (Supabase)

### Enums SQL
```sql
user_role:        admin | secretario_consagracion
tipo_formacion:   san_lorenzo | escuela_de_maria
estado_civil_enum: soltero_a | casado | divorciado | viudo
tipo_leccion:     leccion | retiro
```

### Tablas
| Tabla | Campos clave |
|-------|-------------|
| `profiles` | `id (FK auth.users), role, nombre` |
| `misioneros` | `id, nombre, apellido, dni (unique), whatsapp` |
| `formaciones_misioneros` | `id, tipo, anio, fecha_inicio, dia_semana (0-6)` |
| `inscripciones_misioneros` | `misionero_id FK, formacion_id FK, unique(misionero_id, formacion_id)` |
| `clases` | `id, formacion_id FK, numero, fecha, activa (bool)` |
| `asistencias_misioneros` | `id, clase_id FK, misionero_id FK, asistio, motivo_ausencia, unique(clase_id, misionero_id)` |
| `formaciones_consagracion` | `id, anio (unique), fecha_inicio` |
| `lecciones_consagracion` | `id, formacion_id FK, numero (1-35), tipo, fecha` |
| `inscripciones_consagracion` | `id, formacion_id FK, nombre, apellido, domicilio?, whatsapp, estado_civil, sacramentos (jsonb), comentario?` |
| `asistencias_consagracion` | `id, leccion_id FK, inscripcion_id FK, asistio, unique(leccion_id, inscripcion_id)` |

### RLS Clave
- Páginas públicas `/asistencia` y `/consagracion/inscripcion/[anio]` usan clave anon
- Admin y secretario acceden via JWT autenticado
- **Activar clase**: usar Supabase RPC `activate_clase(p_clase_id, p_formacion_id)` para atomicidad (desactiva todas y activa la elegida en una sola transacción)

---

## Estructura de Rutas

```
/                                         → Landing (logo con animación tinta)
/login                                    → Auth email/password
/asistencia                               → Público: misionero ingresa DNI → confirma clase activa
/consagracion/inscripcion/[anio]          → Público: formulario inscripción consagración

/admin/dashboard                          → Stats generales
/admin/misioneros                         → Lista + crear misioneros (TanStack Table)
/admin/misioneros/[id]                    → Detalle + historial asistencias
/admin/formaciones                        → Lista formaciones
/admin/formaciones/nueva                  → Crear formación
/admin/formaciones/[id]                   → Gestión de clases, activar/desactivar
/admin/formaciones/[id]/asistencias       → Grilla asistencias por clase y misionero
/admin/consagracion/[anio]/inscripciones  → Ver inscripciones
/admin/consagracion/[anio]/asistencias    → Registrar asistencias 33 lecciones + retiros
/admin/usuarios                           → Crear/listar usuarios del sistema con rol

/secretario/inscripciones                 → Igual a admin (solo consagración)
/secretario/asistencias                   → Igual a admin (solo consagración)
```

---

## Archivos y Estructura del Proyecto

```
src/
  app/
    (public)/
      page.tsx                             ← Landing
      login/page.tsx
      asistencia/page.tsx
      consagracion/inscripcion/[anio]/page.tsx
    (admin)/
      admin/
        layout.tsx                         ← Valida rol admin
        dashboard/page.tsx
        misioneros/page.tsx
        misioneros/[id]/page.tsx
        formaciones/page.tsx
        formaciones/nueva/page.tsx
        formaciones/[id]/page.tsx
        formaciones/[id]/asistencias/page.tsx
        consagracion/[anio]/inscripciones/page.tsx
        consagracion/[anio]/asistencias/page.tsx
        usuarios/page.tsx
    (secretario)/
      secretario/
        layout.tsx                         ← Valida rol secretario_consagracion
        inscripciones/page.tsx
        asistencias/page.tsx
  components/
    ui/                                    ← shadcn auto-generados
    shared/
      InkRevealLogo.tsx
      AdminSidebar.tsx
      SecretarioSidebar.tsx
    misioneros/
      MisioneroTable.tsx
      MisioneroForm.tsx
    formaciones/
      FormacionForm.tsx
      ClaseList.tsx
      ClaseActivateButton.tsx
      AsistenciaGrid.tsx
    consagracion/
      InscripcionForm.tsx                  ← Guiado por consagracionFields[]
      InscripcionesView.tsx                ← Compartido admin + secretario
      AsistenciasView.tsx                  ← Compartido admin + secretario
      AsistenciaToggle.tsx
    providers/
      QueryProvider.tsx
  lib/
    supabase/
      client.ts                            ← Browser client
      server.ts                            ← Server Components client
      middleware.ts                        ← Session refresh
    validations/
      misioneros.ts
      consagracion.ts                      ← consagracionFields[] + schema Zod
      auth.ts
    stores/
      authStore.ts                         ← Zustand: user, profile, role
      uiStore.ts                           ← Zustand: loading, modals
    queries/
      misioneros.ts
      formaciones.ts
      clases.ts
      asistenciasMisioneros.ts
      consagracion.ts
      asistenciasConsagracion.ts
    utils/
      dates.ts
    constants/
      roles.ts                             ← USER_ROLES, TIPO_FORMACION, etc.
      consagracion.ts                      ← MAX_LECCIONES, TIPOS_LECCION, etc.
  types/
    supabase.ts                            ← Generado, nunca editar a mano
  middleware.ts
netlify.toml
next.config.ts
tailwind.config.ts
PLAN.md
```

---

## Lógica de Negocio Importante

### Gestión manual de clases
El admin agrega cada clase con su fecha cuando se acerca el día. Al crear la formación, se define tipo, año, fecha de inicio y día de semana (solo como referencia). Las clases se crean una a una desde el panel de la formación y pueden tener su fecha editada si se postergan.

### Clase activa (asistencia pública)
- Admin activa una clase → RPC `activate_clase` desactiva todas las de esa formación y activa la elegida (atómico)
- `/asistencia`: misionero ingresa DNI → se busca clase activa donde está inscripto → confirma asistencia (sí/no) con Dialog de confirmación → insert único en `asistencias_misioneros`
- Una vez confirmado, **no puede modificar**. Admin puede corregir desde el panel

### Formulario consagración flexible
El array `consagracionFields` en `src/lib/validations/consagracion.ts` define qué campos renderiza el form y en qué orden. Para agregar un campo: agregar al array + al schema Zod. El componente `InscripcionForm` lo renderiza dinámicamente sin modificaciones.

### Lecciones consagración (tipo variable)
El admin crea cada lección indicando número, fecha y tipo (leccion | retiro). No hay posiciones fijas para los retiros. La grilla de asistencias muestra las lecciones en orden numérico; los retiros se diferencian visualmente con un badge.

### Confirmación antes de guardar
Toda acción irreversible muestra un `AlertDialog` de shadcn antes del submit. Aplica a: asistencia misionero, inscripción consagración, activar/desactivar clase, crear usuarios del sistema.

### Gestión de usuarios (admin)
Ruta `/admin/usuarios` usa Server Action con `supabaseAdmin` (service role key) para crear usuarios via Supabase Admin API. El rol se asigna al crear. Solo accesible para `admin`.

---

## Orden de Implementación

1. Scaffolding: `create-next-app`, instalar dependencias, `netlify.toml`
2. Schema Supabase SQL + generar `src/types/supabase.ts`
3. Infraestructura: clientes Supabase, middleware, QueryProvider, stores Zustand, constantes
4. Auth: `/login` + layouts protegidos por rol (`(admin)` y `(secretario)`)
5. Landing page con animación tinta (Framer Motion + logo institucional)
6. CRUD Misioneros (tabla TanStack + formulario TanStack Form + Zod)
7. Formaciones + Clases (crear formación, agregar clases, activar/desactivar con RPC)
8. Página pública `/asistencia` (flujo DNI → clase activa → confirmación única)
9. Formulario público consagración `/consagracion/inscripcion/[anio]`
10. Grilla asistencias consagración (TanStack Table 35 columnas dinámicas)
11. Layout secretario + vistas compartidas con admin
12. Panel de usuarios `/admin/usuarios`
13. Dashboard con stats agregadas
14. Deploy Netlify + configurar env vars en dashboard

---

## Configuración Netlify (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

> **No usar `output: 'export'`** — incompatible con middleware SSR y Supabase Auth cookies.

---

## Decisiones de Diseño Confirmadas

| Decisión | Definición |
|----------|-----------|
| Clases de talleres | El admin las crea una a una, sin auto-generación |
| Lecciones consagración | Tipo (leccion/retiro) definido por el admin al crear cada una |
| Asistencia misionero | Una sola vez; no editable por el misionero. Admin puede corregir |
| Confirmación modal | En todos los formularios con acción irreversible |
| Gestión de usuarios | Panel `/admin/usuarios` dentro de la app |
| Estado complejo | Zustand; sin prop drilling |
| Lógica de negocio | Desacoplada en `lib/queries/`, `lib/utils/` y custom hooks |

---

## Verificación

- `npm run dev` → verificar landing con animación
- Crear usuario admin en Supabase Auth → insertar en `profiles` con `role: 'admin'`
- Login → redirección a `/admin/dashboard`
- Crear misionero → crear formación → agregar clase → activar clase → ir a `/asistencia` con DNI → confirmar asistencia
- Crear formación consagración → ir a `/consagracion/inscripcion/[anio]` → completar form → verificar en tabla Supabase
- Login como secretario → verificar acceso solo a `/secretario/*`
- Deploy Netlify: configurar env vars, verificar middleware en Edge Functions
