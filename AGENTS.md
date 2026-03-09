# Code Review Rules — Misioneros de la Consagración

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (fetch/cache) + TanStack Form v1 + TanStack Table
- Zustand (estado global)
- Supabase (PostgreSQL + Auth + RLS)
- Framer Motion v11

## Rules

### TypeScript
- No usar `any` — tipar correctamente siempre
- Usar optional chaining `?.` y nullish coalescing `??` en lugar de verificaciones manuales
- Desestructurar objetos y arrays; evitar variables intermedias innecesarias
- Nombres descriptivos en camelCase que expresen la intención

### Arquitectura y organización
- Lógica de negocio fuera del componente UI — va en `lib/queries/`, `lib/utils/` o hooks custom
- Sin magic strings ni magic numbers — constantes en `src/lib/constants/`
- Un archivo = una responsabilidad; componentes pequeños y componibles
- Zustand para estado compartido — no usar prop drilling
- No duplicar lógica — extraer en hooks o funciones utilitarias (DRY)

### Next.js / Supabase
- Server Components para layouts protegidos por rol
- `createAdminClient()` para Server Actions con service role
- `export const dynamic = 'force-dynamic'` en páginas que usan Supabase en SSR
- No usar `output: 'export'` — incompatible con middleware SSR

### TanStack Form v1
- Usar `validators: { onChange: zodSchema }` — NO `validatorAdapter`
- Schema Zod con tipo de input igual a `defaultValues` — no mezclar `.optional()` en campos con default string
- Usar `ZodError.issues[0].message` (no `.errors[0].message`)

### Calidad general
- Sin `console.log` en código de producción
- Sin código comentado ni variables no utilizadas
- No agregar manejo de errores para escenarios que no pueden ocurrir
- No sobre-ingenierizar — mínima complejidad necesaria para la tarea actual
- No agregar features, refactors o "mejoras" más allá de lo pedido
- Comentarios solo cuando la lógica no sea evidente por sí sola

### Seguridad
- No exponer claves de servicio en cliente
- Validar inputs del usuario con Zod en el boundary del sistema
- No introducir XSS, SQL injection ni otras vulnerabilidades OWASP top 10
