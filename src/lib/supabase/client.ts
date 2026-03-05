import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/** Cliente Supabase para usar en Client Components ('use client') */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
