// Guarded Supabase client: provide a synchronous, safe fallback when env vars
// are not set (so the app doesn't crash on platforms that don't use Supabase).
// When configured, lazily load the real `@supabase/supabase-js` client.
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Minimal synchronous stub used when Supabase is not configured.
const noopUnsubscribe = () => {};
const stubAuth = {
  onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: noopUnsubscribe } } }),
  getSession: async () => ({ data: { session: null } }),
  signOut: async () => ({}),
};

let _supabase: any;

if (!SUPABASE_URL) {
  // Provide a safe synchronous object so imports and immediate property access
  // (like `supabase.auth.onAuthStateChange(...)`) do not throw at runtime.
  _supabase = { auth: stubAuth };
} else {
  let _real: any = null;
  let _loading: Promise<any> | null = null;

  function ensureLoaded() {
    if (_real) return Promise.resolve(_real);
    if (_loading) return _loading;
    _loading = import('@supabase/supabase-js').then((mod) => {
      const { createClient } = mod as any;
      _real = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      return _real;
    });
    return _loading;
  }

  function createThenableProxy(callChain: Array<{ prop: string | symbol; args: any[] }> = []): any {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: any, reject: any) => {
            ensureLoaded().then((real) => {
              try {
                let obj: any = real;
                for (const step of callChain) {
                  const fn = obj[step.prop];
                  if (typeof fn === 'function') {
                    obj = fn.apply(obj, step.args);
                  } else {
                    obj = obj[step.prop];
                  }
                }
                if (obj && typeof obj.then === 'function') {
                  obj.then(resolve, reject);
                } else {
                  resolve(obj);
                }
              } catch (err) {
                reject(err);
              }
            }).catch(reject);
          };
        }
        return (...args: any[]) => {
          const next = callChain.concat([{ prop, args }]);
          return createThenableProxy(next);
        };
      }
    };
    const proxyTarget = () => {};
    return new Proxy(proxyTarget, handler);
  }

  _supabase = createThenableProxy();
  // Add a synchronous `auth` shim on the thenable proxy so code that
  // immediately reads `supabase.auth.onAuthStateChange` (or calls
  // `supabase.auth.getSession()` / `signOut()`) won't blow up at runtime.
  // The shim forwards to the real client once it's loaded, and returns
  // safe defaults before then.
  const authShim = {
    onAuthStateChange(cb: any) {
      let unsubscribe = noopUnsubscribe;
      ensureLoaded().then((real) => {
        try {
          const res = real.auth.onAuthStateChange(cb);
          unsubscribe = res?.data?.subscription?.unsubscribe ?? noopUnsubscribe;
        } catch (e) {
          // ignore and keep noop
        }
      }).catch(() => {});
      return { data: { subscription: { unsubscribe: () => { try { unsubscribe(); } catch {} } } } };
    },
    async getSession() {
      try {
        const real = await ensureLoaded();
        return real.auth.getSession();
      } catch (e) {
        return { data: { session: null } };
      }
    },
    async signOut() {
      try {
        const real = await ensureLoaded();
        return real.auth.signOut();
      } catch (e) {
        return {};
      }
    }
  };

  try {
    // assign onto the proxy target so property access works synchronously
    (_supabase as any).auth = authShim;
  } catch (e) {
    // best-effort: if assignment fails, fall back to exposing a plain object
    _supabase = { auth: authShim };
  }
}

export const supabase = _supabase;