# CLAUDE.md — Misioneros de la Consagración

Reglas persistentes para todas las sesiones de Claude Code en este proyecto.

---

## Gestor de Paquetes
- **pnpm** — usar siempre `pnpm` en lugar de `npm` o `yarn`

---

## Stack Tecnológico

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Zod** + **TanStack Form** (formularios)
- **TanStack Query** (fetch/cache) + **TanStack Table** (tablas)
- **Zustand** (estado global — sin prop drilling)
- **Supabase** (PostgreSQL + Auth email/password + RLS)
- **Netlify** + `@netlify/plugin-nextjs` (deploy)
- **Framer Motion** (animaciones)

---

## Estándares de Código (aplicar siempre)

- **ES2025**: usar sintaxis moderna — optional chaining `?.`, nullish coalescing `??`, destructuring, `await using`, etc.
- **DRY**: extraer lógica repetida en hooks custom, funciones utilitarias o componentes reutilizables
- **Separación de responsabilidades**: lógica de negocio desacoplada del componente UI — va en `lib/queries/`, `lib/utils/` o hooks
- **Sin magic strings ni magic numbers**: toda constante reutilizable definida en `src/lib/constants/`
- **Nombres descriptivos en camelCase**: variables, funciones y props deben expresar su intención claramente
- **Comentarios cortos y útiles**: solo cuando aporten valor; nunca comentar lo obvio
- **Zustand para estado complejo**: evitar prop drilling; usar stores para estado compartido entre componentes
- **Modularidad**: un archivo = una responsabilidad; componentes pequeños y componibles
- **Optional chaining**: usar `?.` y `??` donde corresponda en lugar de verificaciones manuales
- **Desestructuración**: preferir desestructuración de objetos y arrays; evitar variables intermedias innecesarias

---

## Arquitectura

- App Router de Next.js con route groups: `(public)`, `(admin)`, `(secretario)`
- Layouts protegidos por rol usando Server Components (no en middleware para evitar latencia)
- Middleware solo para refresh de sesión Supabase (`updateSession`)
- Páginas públicas usan clave anon de Supabase; rutas protegidas usan JWT autenticado
- Tipos de base de datos generados con `npx supabase gen types typescript` — nunca editarlos a mano

---

## Roles de Usuario

| Rol | Constante | Acceso |
|-----|-----------|--------|
| Admin | `USER_ROLES.ADMIN` | Todo |
| Secretario Consagración | `USER_ROLES.SECRETARIO_CONSAGRACION` | Solo módulo Consagración |

---

## Identidad Visual

### Colores institucionales (tokens Tailwind `brand.*`)
| Token | Hex |
|-------|-----|
| `brand-dark` | `#352213` |
| `brand-brown` | `#936838` |
| `brand-creamLight` | `#f4e8b0` |
| `brand-cream` | `#f7ebd9` |
| `brand-orange` | `#e63912` |
| `brand-gold` | `#fbb825` |
| `brand-navy` | `#023059` |
| `brand-teal` | `#04adbf` |

### Tipografía
- **Títulos**: Cinzel (Google Fonts — alternativa a Trajan Pro Bold institucional)
- **Cuerpo**: Calibri / Georgia / serif

### Logo
- Archivo: `logomisioneros.png` en la raíz del proyecto
- Copiar a `public/` para servir desde Next.js

---

## Notas de Deploy (Netlify)

- Usar `@netlify/plugin-nextjs` — requerido para App Router
- **No usar `output: 'export'`** — incompatible con middleware SSR y Supabase Auth
- Node.js 20 en variables de entorno de build
- Variables de entorno también configuradas en Netlify dashboard

---

## Consultar PLAN.md para detalles completos

El archivo `PLAN.md` en la raíz contiene el schema de base de datos, estructura de rutas, archivos críticos, lógica de negocio y orden de implementación.
