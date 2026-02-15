import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  sku?: string;
  price: number;
  can_buy: number;
  can_rent: number;
  rent_price_per_day: number;
  quantity_in_stock: number;
  quantity_available_for_rent: number;
  reorder_level: number;
  supplier?: string;
  description?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  equipment_id: string;
  equipment_name?: string;
  category?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  transaction_type: string;
  rental_days: number;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  diver_id?: string;
  diver_name?: string;
  diver_email?: string;
  booking_id?: string;
  booking_invoice?: string;
  type: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  items?: TransactionItem[];
  created_at: string;
}

export interface Payment {
  id: string;
  transaction_id: string;
  transaction_number: string;
  transaction_total: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface POSSummary {
  today: {
    transaction_count: number;
    total_sales: number;
    total_paid: number;
    payment_count: number;
  };
  low_stock_items: Equipment[];
}

// Legacy Supabase functions
export async function fetchTopItems(days = 30, limit = 5) {
  const { data } = await supabase.rpc('pos_top_items', { days, limit_val: limit });
  return data || [];
}

// Equipment operations
export const equipment = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/api/equipment`);
    if (!response.ok) throw new Error(`Failed to load equipment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  get: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/equipment/${id}`);
    if (!response.ok) throw new Error(`Failed to load equipment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (item: Partial<Equipment>) => {
    const response = await fetch(`${BASE_URL}/api/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`Failed to create equipment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  update: async (id: string, item: Partial<Equipment>) => {
    const response = await fetch(`${BASE_URL}/api/equipment/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`Failed to update equipment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  delete: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/equipment/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete equipment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },
};

// Transaction operations
export const transactions = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/api/transactions`);
    if (!response.ok) throw new Error(`Failed to load transactions: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  get: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/transactions/${id}`);
    if (!response.ok) throw new Error(`Failed to load transaction: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (transaction: {
    diver_id?: string;
    booking_id?: string;
    items: Array<{ equipment_id: string; quantity: number; unit_price: number; transaction_type?: string; rental_days?: number }>;
    tax?: number;
    discount?: number;
    notes?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error(`Failed to create transaction: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },
};

// Payment operations
export const payments = {
  list: async () => {
    const response = await fetch(`${BASE_URL}/api/payments`);
    if (!response.ok) throw new Error(`Failed to load payments: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (payment: {
    transaction_id: string;
    amount: number;
    payment_method?: string;
    reference_number?: string;
    notes?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    if (!response.ok) throw new Error(`Failed to create payment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },
};

// POS summary
export const pos = {
  getSummary: async () => {
    const response = await fetch(`${BASE_URL}/api/pos/summary`);
    if (!response.ok) throw new Error(`Failed to load POS summary: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },
};

// Rental assignments
export const rentalAssignments = {
  list: async (bookingId?: string) => {
    const url = bookingId ? `${BASE_URL}/api/rental-assignments?booking_id=${bookingId}` : `${BASE_URL}/api/rental-assignments`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load rental assignments: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (assignment: {
    booking_id: string;
    equipment_id: string;
    quantity: number;
    check_in: string;
    check_out: string;
    notes?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/api/rental-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error(`Failed to create rental assignment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },

  delete: async (id: string) => {
    const response = await fetch(`${BASE_URL}/api/rental-assignments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete rental assignment: ${response.status}`);
    const data = await response.json();
    return { data, error: null };
  },
};

// Export functions
export function exportToCSV(rows: any[], filename = 'export.csv') {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, rows: any[], filename = 'export.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  let y = 70;
  rows.forEach(r => {
    const line = Object.values(r).join(' | ');
    doc.text(line, 40, y);
    y += 16;
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
  });
  doc.save(filename);
}

export default { fetchTopItems, exportToCSV, exportToPDF, equipment, transactions, payments, pos, rentalAssignments };
