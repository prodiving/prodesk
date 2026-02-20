// Guarded Supabase client: provide a synchronous, safe fallback when env vars
// are not set (so the app doesn't crash on platforms that don't use Supabase).
// When configured, lazily load the real `@supabase/supabase-js` client.
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Accept either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY (common naming differences)
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

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

  // Build a thenable proxy but allow synchronous overrides for some props
  // (e.g. `auth`) so direct property access returns real functions/objects
  // instead of the proxy-call wrapper.
  function createThenableProxy(
    callChain: Array<{ prop: string | symbol; args: any[] }> = [],
    syncOverrides: Record<string | symbol, any> = {}
  ): any {
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

        // If a synchronous override exists for this property, return it.
        if (callChain.length === 0 && Object.prototype.hasOwnProperty.call(syncOverrides, prop)) {
          return (syncOverrides as any)[prop];
        }

        return (...args: any[]) => {
          const next = callChain.concat([{ prop, args }]);
          return createThenableProxy(next, syncOverrides);
        };
      }
    };
    const proxyTarget = () => {};
    return new Proxy(proxyTarget, handler);
  }

  // The synchronous `auth` shim forwards to the real client's methods
  // once loaded but provides the same call signature immediately.
  const authShim = {
    onAuthStateChange(cb: any) {
      let unsub = noopUnsubscribe;
      ensureLoaded()
        .then((real) => {
          try {
            const res = real.auth.onAuthStateChange(cb);
            unsub = res?.data?.subscription?.unsubscribe ?? noopUnsubscribe;
          } catch (e) {
            // ignore
          }
        })
        .catch(() => {});
      return { data: { subscription: { unsubscribe: () => { try { unsub(); } catch {} } } } };
    },
    getSession() {
      // Return a thenable to match real client usage sites that `await` it.
      return (async () => {
        try {
          const real = await ensureLoaded();
          return real.auth.getSession();
        } catch (e) {
          return { data: { session: null } };
        }
      })();
    },
    signOut() {
      return (async () => {
        try {
          const real = await ensureLoaded();
          return real.auth.signOut();
        } catch (e) {
          return {};
        }
      })();
    },
    signInWithPassword({ email, password }: { email: string; password: string }) {
      return (async () => {
        try {
          const real = await ensureLoaded();
          return real.auth.signInWithPassword({ email, password });
        } catch (e) {
          return { error: { message: 'Supabase not configured' } };
        }
      })();
    },
    signUp({ email, password, options }: { email: string; password: string; options?: any }) {
      return (async () => {
        try {
          const real = await ensureLoaded();
          return real.auth.signUp({ email, password, options });
        } catch (e) {
          return { error: { message: 'Supabase not configured' } };
        }
      })();
    }
  };

  // Create the proxy with `auth` synchronously available.
  _supabase = createThenableProxy([], { auth: authShim });
}

export const supabase = _supabase;