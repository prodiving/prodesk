// Guarded Supabase client: lazy-loads `@supabase/supabase-js` only when configured.
// This avoids bundling the dependency when `VITE_SUPABASE_URL` is not set (e.g., deployments using Railway + Neon without Supabase).
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase: any;

if (SUPABASE_URL) {
  // Top-level await is supported by Vite; dynamically import the package at runtime.
  const mod = await import('@supabase/supabase-js');
  const { createClient } = mod as any;
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      // localStorage may be undefined in some environments; guard it.
      storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} else {
  // Provide a proxy stub that throws a clear error when used.
  const handler: ProxyHandler<any> = {
    get() {
      return () => {
        throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable Supabase features.');
      };
    }
  };
  supabase = new Proxy({}, handler);
}

export { supabase };