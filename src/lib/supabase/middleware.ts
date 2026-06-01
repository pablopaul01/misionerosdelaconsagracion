import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { USER_ROLES } from '@/lib/constants/roles';

/** Refresca la sesión de Supabase en cada request — mantiene cookies al día */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirigir a /login si la ruta es protegida y no hay sesión
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/secretario');
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const rutasRetiroPermitidas = ['/admin/retiros', '/admin/sorteos'];
    const retiroPuedeAcceder = rutasRetiroPermitidas.some((ruta) => pathname.startsWith(ruta));

    if (profile?.role === USER_ROLES.RETIRO && !retiroPuedeAcceder) {
      return NextResponse.redirect(new URL('/admin/retiros', request.url));
    }
  }

  return supabaseResponse;
};
