import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useMaintenanceTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('maintenance_tasks').select('*, gear_stock(*)').order('due_at', { ascending: true });
      if (!mounted) return;
      setTasks(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { tasks, loading };
}

export async function createMaintenanceTask(payload: { gear_stock_id: string; due_at: string; notes?: string }) {
  const { data, error } = await supabase.from('maintenance_tasks').insert([payload]).select().single();
  return { data, error };
}

export async function completeMaintenanceTask(id: string) {
  const { data, error } = await supabase.from('maintenance_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id).select().single();
  if (!error) {
    // also update gear_stock last_maintenance_at
    try {
      const task = data as any;
      if (task?.gear_stock_id) {
        await supabase.from('gear_stock').update({ last_maintenance_at: task.completed_at }).eq('id', task.gear_stock_id);
      }
    } catch (e) {
      // ignore
    }
  }
  return { data, error };
}

// ===== API-based maintenance and problem reporting =====

export const maintenanceRecords = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/api/maintenance-records`);
    if (!response.ok) throw new Error(`Failed to load maintenance records: ${response.status}`);
    const data = await response.json();
    return data || [];
  },

  create: async (record: {
    equipment_id: string;
    reported_by?: string;
    assigned_to?: string;
    issue_description: string;
    priority?: string;
    notes?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/maintenance-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Failed to create maintenance record: ${response.status}`);
    return await response.json();
  },

  update: async (id: string, updates: {
    status?: string;
    assigned_to?: string;
    notes?: string;
    started_at?: string;
    completed_at?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/maintenance-records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update maintenance record: ${response.status}`);
    return await response.json();
  },
};

export const problemReports = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/api/problem-reports`);
    if (!response.ok) throw new Error(`Failed to load problem reports: ${response.status}`);
    const data = await response.json();
    return data || [];
  },

  create: async (report: {
    equipment_id: string;
    reported_by: string;
    problem_description: string;
    severity?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/problem-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error(`Failed to create problem report: ${response.status}`);
    return await response.json();
  },

  update: async (id: string, updates: {
    status?: string;
    assigned_to?: string;
    resolution_notes?: string;
    resolved_at?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/problem-reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update problem report: ${response.status}`);
    return await response.json();
  },
};

export default {
  useMaintenanceTasks,
  createMaintenanceTask,
  completeMaintenanceTask,
  maintenanceRecords,
  problemReports,
};
