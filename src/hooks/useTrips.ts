import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { ENABLE_TRIPS } from '@/config';

const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDevelopment ? 'http://localhost:3000' : '';

export function useTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ENABLE_TRIPS) {
      setTrips([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/trips`, {
          headers: { 'x-user-id': 'user-1' },
        });
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setTrips(data);
        }
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { trips, loading };
}
