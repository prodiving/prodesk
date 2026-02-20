import { useState, useEffect } from 'react';

const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDevelopment ? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') : '';

export function useTripAssignments(tripId: string) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssignments = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/assignments`, {
        headers: { 'x-user-id': 'user-1' },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssignments(data);
      }
    } catch (err) {
      console.error('Failed to load trip assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignDiver = async (diverId: string) => {
    if (!tripId || !diverId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-1' },
        body: JSON.stringify({ diver_id: diverId }),
      });
      
      if (!res.ok) throw new Error('Failed to assign diver');
      
      const assignment = await res.json();
      setAssignments([...assignments, assignment]);
      return assignment;
    } catch (err) {
      console.error('Failed to assign diver:', err);
      throw err;
    }
  };

  const unassignDiver = async (diverId: string) => {
    if (!tripId || !diverId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/assignments/${diverId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-1' },
      });
      
      if (!res.ok) throw new Error('Failed to unassign diver');
      
      setAssignments(assignments.filter(a => a.diver_id !== diverId));
    } catch (err) {
      console.error('Failed to unassign diver:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [tripId]);

  return { assignments, loading, assignDiver, unassignDiver, refetch: loadAssignments };
}
