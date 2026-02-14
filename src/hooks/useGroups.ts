import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    // select groups with leader and members (members include diver info)
    const { data, error } = await supabase
      .from('groups')
      .select('*, leader:leader_id(*), members:group_members(id, role, diver:diver_id(id, name))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('loadGroups error', error);
      setGroups([]);
      setError(error);
      setLoading(false);
      return { data: null, error };
    }

    setGroups(data ?? []);
    setLoading(false);
    return { data };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadGroups();
    })();
    return () => { mounted = false; };
  }, [loadGroups]);

  async function createGroup(payload: { name: string; leader_id?: string | null; description?: string | null }) {
    const { data, error } = await supabase.from('groups').insert([{
      name: payload.name,
      leader_id: payload.leader_id ?? null,
      description: payload.description ?? null,
    }]).select().single();
    if (error) {
      console.error('createGroup error', error);
      setError(error);
    } else if (data) {
      await loadGroups();
    }
    return { data, error };
  }

  async function addMember(groupId: string, diverId: string, role?: string) {
    const { data, error } = await supabase.from('group_members').insert([{ group_id: groupId, diver_id: diverId, role }]).select().single();
    if (error) {
      console.error('addMember error', error);
      setError(error);
    } else {
      await loadGroups();
    }
    return { data, error };
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) {
      console.error('removeMember error', error);
      setError(error);
    } else {
      await loadGroups();
    }
    return { error };
  }

  return { groups, loading, error, createGroup, addMember, removeMember, refresh: loadGroups };
}

export default useGroups;
