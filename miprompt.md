3:36:16 PM: Netlify Build                                                 
3:36:16 PM: ────────────────────────────────────────────────────────────────
3:36:16 PM: ​
3:36:16 PM: ❯ Version
3:36:16 PM:   @netlify/build 35.8.7
3:36:16 PM: ​
3:36:16 PM: ❯ Flags
3:36:16 PM:   accountId: 645bade2151da1050421bcdd
3:36:16 PM:   baseRelDir: true
3:36:16 PM:   buildId: 69af1316a51eb40008ecd48e
3:36:16 PM:   deployId: 69af1316a51eb40008ecd490
3:36:17 PM: ​
3:36:17 PM: ❯ Current directory
3:36:17 PM:   /opt/build/repo
3:36:17 PM: ​
3:36:17 PM: ❯ Config file
3:36:17 PM:   /opt/build/repo/netlify.toml
3:36:17 PM: ​
3:36:17 PM: ❯ Context
3:36:17 PM:   deploy-preview
3:36:17 PM: ​
3:36:17 PM: ❯ Using Next.js Runtime - v5.15.8
3:36:22 PM: Next.js cache restored
3:36:22 PM: ​
3:36:22 PM: build.command from netlify.toml                               
3:36:22 PM: ────────────────────────────────────────────────────────────────
3:36:22 PM: ​
3:36:22 PM: $ pnpm run build
3:36:22 PM: > misionerosdelaconsagracion@0.1.0 build /opt/build/repo
3:36:22 PM: > next build
3:36:23 PM:   ▲ Next.js 14.2.35
3:36:23 PM:    Creating an optimized production build ...
3:36:34 PM:  ✓ Compiled successfully
3:36:34 PM:    Linting and checking validity of types ...
3:36:38 PM: 
3:36:38 PM: Failed to compile.
3:36:38 PM: ./src/app/(admin)/admin/retiros/[id]/page.tsx
3:36:38 PM: 273:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
3:36:38 PM: ./src/app/(admin)/admin/retiros/page.tsx
3:36:38 PM: 169:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
3:36:38 PM: ./src/app/(public)/retiros/[id]/page.tsx
3:36:38 PM: 41:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
3:36:38 PM: ./src/app/(public)/retiros/page.tsx
3:36:38 PM: 42:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
3:36:38 PM: ./src/components/retiros/public/ConversionForm.tsx
3:36:38 PM: 31:9  Error: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
3:36:38 PM: ./src/components/retiros/public/MatrimoniosForm.tsx
3:36:38 PM: 29:9  Error: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
3:36:38 PM: ./src/components/retiros/public/MisionerosForm.tsx
3:36:38 PM: 16:9  Error: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
3:36:38 PM: info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
3:36:38 PM:  ELIFECYCLE  Command failed with exit code 1. (https://ntl.fyi/exit-code-1)
3:36:38 PM: ​
3:36:38 PM: "build.command" failed                                        
3:36:38 PM: ────────────────────────────────────────────────────────────────
3:36:38 PM: ​
3:36:38 PM:   Error message
3:36:38 PM:   Command failed with exit code 1: pnpm run build (https://ntl.fyi/exit-code-1)
3:36:38 PM: ​
3:36:38 PM:   Error location
3:36:38 PM:   In build.command from netlify.toml:
3:36:38 PM:   pnpm run build
3:36:38 PM: ​
3:36:38 PM:   Resolved config
3:36:38 PM:   build:
3:36:38 PM:     command: pnpm run build
3:36:38 PM:     commandOrigin: config
3:36:38 PM:     environment:
3:36:38 PM:       - NEXT_PUBLIC_SUPABASE_ANON_KEY
3:36:38 PM:       - NEXT_PUBLIC_SUPABASE_URL
3:36:38 PM:       - REVIEW_ID
3:36:38 PM:       - SUPABASE_ACCESS_TOKEN
3:36:38 PM:       - SUPABASE_SERVICE_ROLE_KEY
3:36:38 PM:       - NODE_VERSION
3:36:38 PM:     publish: /opt/build/repo/.next
3:36:38 PM:     publishOrigin: config
3:36:38 PM:   plugins:
3:36:38 PM:     - inputs: {}
3:36:38 PM:       origin: config
3:36:38 PM:       package: "@netlify/plugin-nextjs"
3:36:38 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
3:36:39 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
3:36:39 PM: Failing build: Failed to build site
3:36:39 PM: Finished processing build request in 31.089s