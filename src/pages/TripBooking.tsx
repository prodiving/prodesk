import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ENABLE_TRIPS } from '@/config';
import { useQuery } from '@tanstack/react-query';
import WaiverForm from '@/components/WaiverForm';

export default function TripBooking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trip } = useQuery(['trip', id], async () => {
    if (!ENABLE_TRIPS) return null;
    const { data } = await supabase.from('trips').select('*').eq('id', id).single();
    return data;
  });

  async function handleBook() {
    // call edge function via supabase functions invoke
    const body = { trip_id: id };
    const res = await supabase.functions.invoke('book-trip', { body: JSON.stringify(body) });
    if (res.error) {
      alert('Booking failed: ' + res.error.message);
      return;
    }
    alert('Booking created');
    navigate('/bookings');
  }

  if (!ENABLE_TRIPS) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Book Trip (disabled)</h1>
        <div className="text-sm text-muted-foreground">Trip bookings are disabled.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Book Trip</h1>
      {trip ? (
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <div className="font-semibold">{trip.name}</div>
            <div className="text-sm text-muted-foreground">{new Date(trip.start_at).toLocaleString()}</div>
            <div className="mt-2">Capacity: {trip.capacity}</div>
          </div>

          <div className="p-4 border rounded">
            <WaiverForm />
          </div>

          <div>
            <button onClick={handleBook} className="btn primary">Reserve Spot</button>
          </div>
        </div>
      ) : (
        <div>Loading…</div>
      )}
    </div>
  );
}
