import React from 'react';
import { Link } from 'react-router-dom';
import { useTrips } from '@/hooks/useTrips';
import { ENABLE_TRIPS } from '@/config';

export default function TripsPage() {
  const { trips, loading } = useTrips();

  if (!ENABLE_TRIPS) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Trips (disabled)</h1>
        <div className="text-sm text-muted-foreground">The trips feature is currently disabled.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Upcoming Trips</h1>
      {loading && <div>Loading trips…</div>}
      <div className="space-y-3">
        {trips.map((t) => (
          <div key={t.id} className="p-4 border rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{new Date(t.start_at).toLocaleString()}</div>
              </div>
              <div className="space-x-2">
                <Link to={`/trips/${t.id}`} className="btn">View</Link>
                <Link to={`/trips/${t.id}/book`} className="btn primary">Book</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
