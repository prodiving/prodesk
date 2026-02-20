import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function DebugPage() {
  const [status, setStatus] = useState<string>('idle');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setStatus('checking env');
      try {
        const url = import.meta.env.VITE_SUPABASE_URL ?? null;
        const keyPresent = !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        setDetails({ url: url ? url.replace(/(:\/\/)(.*)$/,'$1***') : null, keyPresent });
        setStatus('querying supabase');
        // Query `divers` (seeded) so debug page works out-of-the-box for this project.
        const { data, error } = await supabase.from('divers').select('id, name').limit(1);
        if (error) {
          setStatus('error');
          setDetails((d:any) => ({ ...d, queryError: error.message }));
        } else {
          setStatus('ok');
          setDetails((d:any) => ({ ...d, sampleProfiles: data }));
        }
      } catch (err:any) {
        setStatus('exception');
        setDetails({ error: err?.message ?? String(err) });
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-3">Debug: Supabase connectivity</h2>
      <div className="mb-2"><strong>Status:</strong> {status}</div>
      <pre className="bg-surface p-3 rounded text-sm overflow-auto">{JSON.stringify(details, null, 2)}</pre>
      <div className="text-sm text-muted-foreground mt-3">This page masks the Supabase URL and does not expose your anon key. It attempts a read from `profiles` to surface connection/auth errors.</div>
    </div>
  );
}
