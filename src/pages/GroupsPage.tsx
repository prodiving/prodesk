import React, { useState, useEffect } from 'react';
import useGroups from '@/hooks/useGroups';
import { supabase } from '@/integrations/supabase/client';

export default function GroupsPage() {
  const { groups, loading, error, refresh, createGroup, addMember, removeMember } = useGroups();
  const [divers, setDivers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [leader, setLeader] = useState<string | undefined>(undefined);
  const [selectedForGroup, setSelectedForGroup] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('divers').select('id, name');
      if (data) setDivers(data);
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    await createGroup({ name, leader_id: leader ?? null });
    setName('');
    setLeader(undefined);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
        <p className="page-description">Create and manage diver groups and assign a leader (instructor/divemaster)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 p-4 border rounded">
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm">Group name</label>
              <input className="w-full" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Leader (optional)</label>
              <select className="w-full" value={leader ?? ''} onChange={(e) => setLeader(e.target.value || undefined)}>
                <option value="">— none —</option>
                {divers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <button className="btn">Create Group</button>
            </div>
          </form>
        </div>

        <div className="col-span-2 p-4 border rounded">
          <h3 className="font-semibold mb-3">Existing Groups</h3>
          {loading && <div>Loading…</div>}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <div>Failed to load groups: {error.message || JSON.stringify(error)}</div>
              <div className="mt-2">
                <button className="btn btn-sm" onClick={() => refresh()}>Reload</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {groups.map((g:any) => (
              <div key={g.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-sm text-muted-foreground">Leader: {g.leader?.name || '—'}</div>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-sm">Members</label>
                  <div className="mt-2 space-y-2">
                    {(g.members ?? []).length === 0 && <div className="text-sm text-muted-foreground">No members</div>}
                    {(g.members ?? []).map((m:any) => (
                      <div key={m.id} className="flex items-center justify-between bg-muted p-2 rounded">
                        <div>{m.diver?.name || 'Unknown'}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">{m.role || ''}</div>
                          <button className="btn btn-sm" onClick={async () => {
                            if (!confirm(`Remove ${m.diver?.name || 'this member'} from ${g.name}?`)) return;
                            await removeMember(m.id);
                          }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm">Add member</label>
                  <div className="flex gap-2 mt-2">
                    <select className="flex-1" value={selectedForGroup[g.id] ?? ''} onChange={(e) => setSelectedForGroup(s => ({ ...s, [g.id]: e.target.value }))}>
                      <option value="">Select diver…</option>
                      {divers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button onClick={async (e) => {
                      e.preventDefault();
                      const diverId = selectedForGroup[g.id];
                      if (!diverId) return;
                      await addMember(g.id, diverId);
                      setSelectedForGroup(s => ({ ...s, [g.id]: '' }));
                    }} className="btn">Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}