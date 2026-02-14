import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/integrations/api/client';

export function useGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.groups.list();
      setGroups(data ?? []);
    } catch (err) {
      console.error('loadGroups error', err);
      setGroups([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadGroups();
    })();
    return () => { mounted = false; };
  }, [loadGroups]);

  async function createGroup(payload: { 
    name: string
    type?: 'fundive' | 'course'
    leader_id?: string | null
    course_id?: string | null
    days?: number | null
    description?: string | null 
  }) {
    try {
      const data = await apiClient.groups.create({
        name: payload.name,
        type: payload.type ?? 'fundive',
        leader_id: payload.leader_id ?? null,
        course_id: payload.course_id ?? null,
        days: payload.days ?? null,
        description: payload.description ?? null,
      });
      await loadGroups();
      return { data, error: null };
    } catch (err) {
      console.error('createGroup error', err);
      setError(err);
      return { data: null, error: err };
    }
  }

  async function addMember(groupId: string, diverId: string, role?: string) {
    try {
      const data = await apiClient.groups.addMember(groupId, { diver_id: diverId, role });
      await loadGroups();
      return { data, error: null };
    } catch (err) {
      console.error('addMember error', err);
      setError(err);
      return { data: null, error: err };
    }
  }

  async function removeMember(memberId: string, groupId: string) {
    try {
      await apiClient.groups.removeMember(groupId, memberId);
      await loadGroups();
      return { error: null };
    } catch (err) {
      console.error('removeMember error', err);
      setError(err);
      return { error: err };
    }
  }

  return { groups, loading, error, createGroup, addMember, removeMember, refresh: loadGroups };
}

export default useGroups;
