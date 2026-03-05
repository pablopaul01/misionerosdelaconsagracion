import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const middleware = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas de Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
