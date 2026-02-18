import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Save, ShoppingCart, Wrench, AlertTriangle } from 'lucide-react';
import { StripeCheckoutModal } from '@/components/StripeCheckoutModal';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { ProblemReportModal } from '@/components/ProblemReportModal';

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
  // Stripe checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyingItem, setBuyingItem] = useState<any>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyTransaction, setBuyTransaction] = useState<any>(null);
  // Maintenance and problem reporting state
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [problemReportOpen, setProblemReportOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);

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
  
  const { toast } = useToast();

  const openRentalFor = async (it: any) => {
    setSelectedEquipment(it);
    setRentalForm({ ...rentalForm, quantity: 1, diver_id: '', check_in: new Date().toISOString().slice(0,10), check_out: new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10) });
    try {
      const diverData = await apiClient.divers.list().catch(() => []);
      setDivers(Array.isArray(diverData) ? diverData : []);
    } catch (err) {
      console.error('Failed to load divers for rental dialog', err);
      toast({ title: 'Error', description: 'Failed to load divers', variant: 'destructive' });
    }
    setOpenRental(true);
  };
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
      window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
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
      // decrement available (send full merged payload)
      const newAvail = (it.quantity_available_for_rent || 0) - qty;
      const existing = items.find(e => e.id === it.id) || it;
      const merged = { ...existing, quantity_available_for_rent: Math.max(0, newAvail) };
      await apiClient.equipment.update(it.id, merged);
      await load();
      await loadAssignments();
      window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
      toast({ title: 'Checked out', description: `Checked out ${qty} x ${it.name}` });
    } catch (err) {
      console.error('Checkout failed', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const handleReturnAssignment = async (assignment: any) => {
    if (!confirm(`Return ${assignment.quantity} x ${assignment.equipment_name}?`)) return;
    try {
      await apiClient.rentalAssignments.delete(assignment.id);
      // increment available on equipment
      const eq = items.find(i => i.id === assignment.equipment_id);
      const newAvail = (eq.quantity_available_for_rent || 0) + (assignment.quantity || 0);
      const mergedEq = { ...eq, quantity_available_for_rent: newAvail };
      await apiClient.equipment.update(assignment.equipment_id, mergedEq);
      await load();
      await loadAssignments();
      window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
      toast({ title: 'Returned', description: `Returned ${assignment.quantity} x ${assignment.equipment_name || assignment.equipment_id}` });
    } catch (err) {
      console.error('Return failed', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const handleBuy = async (item: any) => {
    setBuyingItem(item);
    setBuyQuantity(1);
    // Create transaction record
    try {
      const transaction = await apiClient.transactions.create({
        items: [
          {
            equipment_id: item.id,
            quantity: 1,
            unit_price: item.price || 0,
            transaction_type: 'buy',
            rental_days: 0,
          },
        ],
        tax: 0,
        discount: 0,
        notes: `Direct purchase of ${item.name}`,
      });
      setBuyTransaction(transaction);
      setCheckoutOpen(true);
    } catch (err) {
      console.error('Failed to create transaction', err);
      toast({ title: 'Error', description: 'Failed to create transaction', variant: 'destructive' });
    }
  };

  const handleBuySuccess = async (paymentIntentId: string) => {
    if (!buyTransaction || !buyingItem) return;
    try {
      // Payment was already recorded by the confirm endpoint on backend
      toast({ title: 'Success', description: `Purchased ${buyingItem.name}!` });
      // Optional: decrement stock
      const updatedItem = {
        ...buyingItem,
        quantity_in_stock: Math.max(0, (buyingItem.quantity_in_stock || 0) - buyQuantity),
      };
      await apiClient.equipment.update(buyingItem.id, updatedItem);
      await load();
      setBuyingItem(null);
      setBuyTransaction(null);
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const openMaintenance = (item: any) => {
    setSelectedItemForModal(item);
    setMaintenanceOpen(true);
  };

  const openProblemReport = (item: any) => {
    setSelectedItemForModal(item);
    setProblemReportOpen(true);
  };

  const getStatusBadge = (item: any) => {
    const status = item.status || 'available';
    const statusConfig: Record<string, { variant: any; label: string }> = {
      available: { variant: 'secondary', label: 'Available' },
      maintenance: { variant: 'warning', label: 'In Maintenance' },
      reserved: { variant: 'outline', label: 'Reserved' },
      unavailable: { variant: 'destructive', label: 'Unavailable' },
    };
    const config = statusConfig[status] || statusConfig.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
                  <td>{getStatusBadge(it)}</td>
                  <td>
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" onClick={() => handleSave(it.id)} disabled={savingId === it.id} className="text-xs">
                        {savingId === it.id ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" onClick={() => handleBuy(it)} variant="default" className="gap-1 text-xs">
                        <ShoppingCart className="h-3 w-3" />
                        Buy
                      </Button>
                      <Button size="sm" onClick={() => openRentalFor(it)} className="text-xs">
                        Rent
                      </Button>
                      <Button size="sm" onClick={() => openMaintenance(it)} variant="outline" className="gap-1 text-xs">
                        <Wrench className="h-3 w-3" />
                        Maint.
                      </Button>
                      <Button size="sm" onClick={() => openProblemReport(it)} variant="outline" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Report
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

      {/* Active Rentals */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Active Rentals</h2>
        {assignments.length === 0 ? (
          <div className="text-muted-foreground">No active rentals</div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.equipment_name || a.equipment_id}</div>
                  <div className="text-sm text-muted-foreground">Rented to: {divers.find(d=>d.id===a.diver_id)?.name || a.diver_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{a.quantity} · {a.check_in} → {a.check_out}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'active' ? 'secondary' : 'destructive'}>{a.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => handleReturnAssignment(a)}>Return</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rental Dialog */}
      <Dialog open={openRental} onOpenChange={setOpenRental}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent Equipment{selectedEquipment ? ` — ${selectedEquipment.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Diver</Label>
              <Select value={rentalForm.diver_id} onValueChange={(v) => setRentalForm({...rentalForm, diver_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select diver..." />
                </SelectTrigger>
                <SelectContent>
                  {divers.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input type="number" value={String(rentalForm.quantity)} onChange={(e) => setRentalForm({...rentalForm, quantity: Math.max(1, Number(e.target.value))})} className="w-40" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check-in</Label>
                <Input type="date" value={rentalForm.check_in} onChange={(e) => setRentalForm({...rentalForm, check_in: e.target.value})} />
              </div>
              <div>
                <Label>Check-out</Label>
                <Input type="date" value={rentalForm.check_out} onChange={(e) => setRentalForm({...rentalForm, check_out: e.target.value})} />
              </div>
            </div>

              <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenRental(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!selectedEquipment) return;
                if (!rentalForm.diver_id) { toast({ title: 'Error', description: 'Select a diver', variant: 'destructive' }); return; }
                const max = selectedEquipment.quantity_available_for_rent ?? selectedEquipment.quantity_in_stock ?? 0;
                if (rentalForm.quantity > max) { toast({ title: 'Error', description: 'Not enough available units', variant: 'destructive' }); return; }
                try {
                  // Backend requires a booking_id. Try to find an existing booking for the diver first.
                  const diverId = rentalForm.diver_id;
                  let bookingId: string | null = null;
                  try {
                    const allBookings = await apiClient.bookings.list().catch(() => []);
                    const diverBookings = Array.isArray(allBookings) ? allBookings.filter((b: any) => String(b.diver_id) === String(diverId)) : [];
                    if (diverBookings.length > 0) {
                      bookingId = diverBookings[0].id;
                    }
                  } catch (err) {
                    // ignore
                  }

                  if (!bookingId) {
                    // create a lightweight booking for this diver so rental can be associated
                    const bk = await apiClient.bookings.create({ diver_id: diverId, check_in: rentalForm.check_in, check_out: rentalForm.check_out });
                    bookingId = bk.id;
                  }

                  await apiClient.rentalAssignments.create({ booking_id: bookingId, equipment_id: selectedEquipment.id, quantity: rentalForm.quantity, check_in: rentalForm.check_in, check_out: rentalForm.check_out });

                  const newAvail = Math.max(0, (selectedEquipment.quantity_available_for_rent || 0) - rentalForm.quantity);
                  const existingEq = items.find(i => i.id === selectedEquipment.id) || selectedEquipment;
                  const mergedEq = { ...existingEq, quantity_available_for_rent: newAvail };
                  await apiClient.equipment.update(selectedEquipment.id, mergedEq);
                  await load();
                  await loadAssignments();
                  window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
                  setOpenRental(false);
                  toast({ title: 'Rented', description: `Rented ${rentalForm.quantity} x ${selectedEquipment.name}` });
                } catch (err) {
                  console.error('Create rental failed', err);
                  toast({ title: 'Error', description: String(err), variant: 'destructive' });
                }
              }}>Create Rental</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout Modal */}
      {buyingItem && buyTransaction && (
        <StripeCheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          amount={(buyingItem.price || 0) * buyQuantity}
          description={`Buy ${buyQuantity} x ${buyingItem.name}`}
          onSuccess={handleBuySuccess}
        />
      )}

      {/* Maintenance Modal */}
      {selectedItemForModal && (
        <MaintenanceModal
          open={maintenanceOpen}
          onOpenChange={setMaintenanceOpen}
          equipment={selectedItemForModal}
          divers={divers}
          onSuccess={load}
        />
      )}

      {/* Problem Report Modal */}
      {selectedItemForModal && (
        <ProblemReportModal
          open={problemReportOpen}
          onOpenChange={setProblemReportOpen}
          equipment={selectedItemForModal}
          divers={divers}
          onSuccess={load}
        />
      )}
    </div>
  );
}
