import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/integrations/api/client';
import { Trash2, Plus, Save } from 'lucide-react';

export default function EquipmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openRental, setOpenRental] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [rentalForm, setRentalForm] = useState({
    diver_id: '',
    quantity: 1,
    check_in: new Date().toISOString().slice(0, 10),
    check_out: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [equipmentData, diverData] = await Promise.all([
        apiClient.equipment.list().catch(() => []),
        apiClient.divers.list().catch(() => []),
      ]);
      setItems(Array.isArray(equipmentData) ? equipmentData : []);
      setDivers(Array.isArray(diverData) ? diverData : []);
      console.log('Equipment loaded:', equipmentData);
    } catch (err) {
      console.error('Failed to load equipment', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadAssignments = async () => {
    try {
      const data = await apiClient.rentalAssignments.list('');
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load assignments', err);
      setAssignments([]);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const getStatus = (it: any) => {
    if (typeof it.quantity_available_for_rent === 'number') {
      return it.quantity_available_for_rent > 0 ? 'Available' : 'Rented out';
    }
    return 'Unknown';
  };

  const handleEdit = (id: string, field: string, value: any) => {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
  };

  const handleSave = async (id: string) => {
    const payload = edits[id];
    if (!payload || Object.keys(payload).length === 0) {
      alert('No changes to save');
      return;
    }
    setSavingId(id);
    try {
      // Merge edits with existing item to preserve all fields
      const existing = items.find(i => i.id === id);
      if (!existing) {
        alert('Item not found');
        setSavingId(null);
        return;
      }
      const fullPayload = { ...existing, ...payload };
      console.log('Saving equipment with payload:', fullPayload);
      const result = await apiClient.equipment.update(id, fullPayload);
      console.log('Save result:', result);
      await load();
      setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
      alert('Equipment saved successfully');
    } catch (err) {
      console.error('Save failed', err);
      alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment item?')) return;
    try {
      await apiClient.equipment.delete(id);
      await load();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete');
    }
  };

  const addExamples = async () => {
    const examples = [
      { name: 'BCD (Buoyancy Compensator)', category: 'Dive Gear', price: 199.99, can_rent: true, rent_price_per_day: 10, quantity_in_stock: 5, quantity_available_for_rent: 5 },
      { name: 'Regulator Set', category: 'Dive Gear', price: 349.99, can_rent: true, rent_price_per_day: 15, quantity_in_stock: 3, quantity_available_for_rent: 3 },
      { name: 'Wetsuit (3mm)', category: 'Apparel', price: 79.99, can_rent: true, rent_price_per_day: 5, quantity_in_stock: 6, quantity_available_for_rent: 6 },
      { name: 'Dive Computer', category: 'Electronics', price: 499.99, can_rent: false, rent_price_per_day: 0, quantity_in_stock: 2, quantity_available_for_rent: 0 },
    ];
    try {
      for (const ex of examples) {
        await apiClient.equipment.create(ex);
      }
      await load();
      await loadAssignments();
    } catch (err) {
      console.error('Failed to create examples', err);
      alert('Failed to add example items');
    }
  };

  const rentedCountFor = (id: string) => {
    return assignments.filter(a => a.equipment_id === id && a.status === 'active').reduce((s, a) => s + (a.quantity || 0), 0);
  };

  const handleCheckOut = async (it: any) => {
    const max = it.quantity_available_for_rent ?? it.quantity_in_stock ?? 0;
    const qStr = window.prompt(`Quantity to check out (max ${max}):`, '1');
    if (!qStr) return;
    const qty = Math.max(1, Number(qStr));
    if (qty > max) { alert('Not enough available units'); return; }
    const bookingId = window.prompt('Booking ID (optional):', '');
    const checkIn = window.prompt('Check-in date (YYYY-MM-DD):', new Date().toISOString().slice(0,10));
    const checkOut = window.prompt('Check-out date (YYYY-MM-DD):', new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10));
    try {
      const payload: any = { equipment_id: it.id, quantity: qty, check_in: checkIn, check_out: checkOut };
      if (bookingId) payload.booking_id = bookingId;
      const res = await apiClient.rentalAssignments.create(payload);
      // decrement available
      const newAvail = (it.quantity_available_for_rent || 0) - qty;
      await apiClient.equipment.update(it.id, { quantity_available_for_rent: Math.max(0, newAvail) });
      await load();
      await loadAssignments();
      alert('Checked out');
    } catch (err) {
      console.error('Checkout failed', err);
      alert('Failed to check out');
    }
  };

  const handleReturnAssignment = async (assignment: any) => {
    if (!confirm(`Return ${assignment.quantity} x ${assignment.equipment_name}?`)) return;
    try {
      await apiClient.rentalAssignments.delete(assignment.id);
      // increment available on equipment
      const eq = items.find(i => i.id === assignment.equipment_id);
      const newAvail = (eq.quantity_available_for_rent || 0) + (assignment.quantity || 0);
      await apiClient.equipment.update(assignment.equipment_id, { quantity_available_for_rent: newAvail });
      await load();
      await loadAssignments();
      alert('Returned');
    } catch (err) {
      console.error('Return failed', err);
      alert('Failed to return');
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Equipment Inventory and Prices & Availability</h1>
          <p className="page-description">Manage equipment inventory, pricing, and availability status</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addExamples} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Example Items</Button>
          <Button onClick={load}><Save className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading equipment…</div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr className="bg-muted/50">
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rent /day</th>
                <th>Available</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No equipment yet</td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                  <td className="max-w-xs">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.sku || ''} {it.barcode ? `· ${it.barcode}` : ''}</div>
                  </td>
                  <td>{it.category}</td>
                  <td>
                    <Input type="number" value={(edits[it.id]?.price ?? it.price ?? 0)} onChange={(e) => handleEdit(it.id, 'price', Number(e.target.value))} className="w-28" />
                  </td>
                  <td>
                    <Input type="number" value={(edits[it.id]?.rent_price_per_day ?? it.rent_price_per_day ?? 0)} onChange={(e) => handleEdit(it.id, 'rent_price_per_day', Number(e.target.value))} className="w-28" />
                  </td>
                  <td>
                    <Input type="number" value={(edits[it.id]?.quantity_available_for_rent ?? it.quantity_available_for_rent ?? 0)} onChange={(e) => handleEdit(it.id, 'quantity_available_for_rent', Number(e.target.value))} className="w-28" />
                  </td>
                  <td>
                    <Badge variant={(edits[it.id]?.quantity_available_for_rent ?? it.quantity_available_for_rent ?? 0) > 0 ? 'secondary' : 'destructive'}>
                      {(edits[it.id]?.quantity_available_for_rent ?? it.quantity_available_for_rent ?? 0) > 0 ? 'Available' : 'Rented out'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={() => handleSave(it.id)} disabled={savingId === it.id}>
                        {savingId === it.id ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
