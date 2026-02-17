import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/integrations/api/client';
import { 
  Trash2, Plus, Save, Wrench, AlertTriangle, CheckCircle, 
  Package, DollarSign, Search, Filter, Calendar, Clock
} from 'lucide-react';

export default function EquipmentMaintenancePage(props: { initialDiverId?: string, embedded?: boolean, onRentalCreated?: () => void } = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const { initialDiverId } = props;
  const filterDiverId = initialDiverId ?? searchParams.get('diver_id');
  const [openRental, setOpenRental] = useState(false);
  const [selectedEquipmentForRental, setSelectedEquipmentForRental] = useState<any>(null);
  const [rentalForm, setRentalForm] = useState({ diver_id: '', quantity: 1, check_in: new Date().toISOString().slice(0,10), check_out: new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10) });
  const { toast } = useToast();
  const embedded = Boolean(props.embedded);
  const containerClass = embedded ? 'h-[80vh] overflow-auto p-4' : '';
  const inlineModalRef = useRef<HTMLDivElement | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.equipment.list();
      setItems(Array.isArray(data) ? data : []);
      console.log('Equipment loaded:', data);
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
      const data = await apiClient.rentalAssignments.list();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load assignments', err);
      setAssignments([]);
    }
  };

  useEffect(() => { loadAssignments(); }, []);
  useEffect(() => {
    // reload when query param changes
    loadAssignments();
  }, [filterDiverId]);

  const getStatus = (it: any) => {
    if (typeof it.quantity_available_for_rent === 'number') {
      return it.quantity_available_for_rent > 0 ? 'Available' : 'Rented out';
    }
    return 'Unknown';
  };

  const getMaintenanceStatus = (it: any) => {
    // Simple logic - in real app this would be based on last maintenance date
    const daysSinceLastUse = Math.floor(Math.random() * 100); // Mock data
    if (daysSinceLastUse > 90) return { status: 'Due', color: 'destructive', icon: AlertTriangle };
    if (daysSinceLastUse > 60) return { status: 'Soon', color: 'secondary', icon: Wrench };
    return { status: 'Good', color: 'default', icon: CheckCircle };
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
      { name: 'Scuba Fins', category: 'Fins', price: 89.99, can_rent: true, rent_price_per_day: 8, quantity_in_stock: 8, quantity_available_for_rent: 8 },
      { name: 'Dive Boots', category: 'Shoe', price: 49.99, can_rent: true, rent_price_per_day: 5, quantity_in_stock: 6, quantity_available_for_rent: 6 },
      { name: 'BCD Jacket', category: 'BCD', price: 299.99, can_rent: true, rent_price_per_day: 15, quantity_in_stock: 4, quantity_available_for_rent: 4 },
      { name: 'Wetsuit 3mm', category: 'Wetsuit', price: 129.99, can_rent: true, rent_price_per_day: 10, quantity_in_stock: 5, quantity_available_for_rent: 5 },
      { name: 'Dive Computer', category: 'Computer', price: 399.99, can_rent: true, rent_price_per_day: 20, quantity_in_stock: 3, quantity_available_for_rent: 3 },
      { name: 'Dive Mask', category: 'Mask', price: 59.99, can_rent: true, rent_price_per_day: 4, quantity_in_stock: 12, quantity_available_for_rent: 12 },
      { name: 'Mask & Snorkel Set', category: 'Fins', price: 39.99, can_rent: true, rent_price_per_day: 4, quantity_in_stock: 10, quantity_available_for_rent: 10 },
      { name: 'Regulator Set', category: 'Shoe', price: 349.99, can_rent: true, rent_price_per_day: 18, quantity_in_stock: 3, quantity_available_for_rent: 3 },
      { name: 'Dive Knife', category: 'Fins', price: 29.99, can_rent: true, rent_price_per_day: 3, quantity_in_stock: 7, quantity_available_for_rent: 7 },
      { name: 'Dive Light', category: 'Computer', price: 79.99, can_rent: true, rent_price_per_day: 6, quantity_in_stock: 4, quantity_available_for_rent: 4 },
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

  const openRentalFor = async (it: any) => {
    setSelectedEquipmentForRental(it);
    setRentalForm({ diver_id: '', quantity: 1, check_in: new Date().toISOString().slice(0,10), check_out: new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10) });
    try {
      const diverData = await apiClient.divers.list().catch(() => []);
      setDivers(Array.isArray(diverData) ? diverData : []);
    } catch (err) {
      console.error('Failed to load divers for rental dialog', err);
      toast({ title: 'Error', description: 'Failed to load divers', variant: 'destructive' });
    }
    // preselect diver from query param if present
    if (filterDiverId) setRentalForm((f) => ({ ...f, diver_id: String(filterDiverId) }));
    setOpenRental(true);
  };

  const handleReturnAssignment = async (assignment: any) => {
    if (!confirm(`Return ${assignment.quantity} x ${assignment.equipment_name}?`)) return;
    try {
      await apiClient.rentalAssignments.delete(assignment.id);
      const eq = items.find(i => i.id === assignment.equipment_id);
      const newAvail = (eq.quantity_available_for_rent || 0) + (assignment.quantity || 0);
      const merged = { ...eq, quantity_available_for_rent: newAvail };
      await apiClient.equipment.update(assignment.equipment_id, merged);
      await load();
      await loadAssignments();
      alert('Returned');
    } catch (err) {
      console.error('Return failed', err);
      alert('Failed to return');
    }
  };

  const categories = ['All', 'Fins', 'Shoe', 'BCD', 'Wetsuit', 'Computer', 'Mask'];
  
  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'All' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (!embedded || !openRental) return;
    const modal = inlineModalRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const selector = 'a[href], area[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = modal ? Array.from(modal.querySelectorAll<HTMLElement>(selector)) : [];
    if (focusable.length) {
      focusable[0].focus();
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenRental(false);
        e.stopPropagation();
        return;
      }
      if (e.key === 'Tab') {
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      if (previouslyFocused) previouslyFocused.focus();
    };
  }, [embedded, openRental]);

  return (
    <div className={containerClass}>
      <div className="page-header flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Equipment Items and Rental - Maintenance</h1>
          <p className="page-description">Manage equipment rentals and maintenance schedules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addExamples} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Equipment Item</Button>
          <Button onClick={load}><Save className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </div>

      {/* Equipment Rentals Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Equipment Rentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(cat)}
              >
                {cat}
              </Button>
            ))}
            <select className="ml-4 px-3 py-1 border rounded">
              <option>Rental</option>
              <option>Maintenance</option>
              <option>Available</option>
            </select>
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm">Clear</Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading equipment…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No equipment found</div>
              ) : filteredItems.map((it) => {
                const maintenance = getMaintenanceStatus(it);
                const MaintenanceIcon = maintenance.icon;
                return (
                  <Card key={it.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{it.name}</h3>
                          <p className="text-sm text-muted-foreground">{it.category} {it.sku && `• ${it.sku}`}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Name:</Label>
                              <Input
                                value={edits[it.id]?.name || it.name}
                                onChange={(e) => handleEdit(it.id, 'name', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Equipment name"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Price:</Label>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={edits[it.id]?.price || it.price}
                                  onChange={(e) => handleEdit(it.id, 'price', parseFloat(e.target.value))}
                                  className="h-8 text-sm w-24"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Daily Rent:</Label>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={edits[it.id]?.rent_price_per_day || it.rent_price_per_day}
                                  onChange={(e) => handleEdit(it.id, 'rent_price_per_day', parseFloat(e.target.value))}
                                  className="h-8 text-sm w-24"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">${it.price?.toFixed(2) || '0.00'}</span>
                          <Badge variant={getStatus(it) === 'Available' ? 'secondary' : 'destructive'}>
                            {getStatus(it)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span>Rent: ${it.rent_price_per_day?.toFixed(2) || '0.00'}/day</span>
                          <Badge variant={maintenance.color} className="flex items-center gap-1">
                            <MaintenanceIcon className="w-3 h-3" />
                            {maintenance.status}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Available: {it.quantity_available_for_rent || 0} / {it.quantity_in_stock || 0}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(it.id, 'name', prompt('Edit name:', it.name))}
                            variant="outline"
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openRentalFor(it)}
                            disabled={getStatus(it) !== 'Available'}
                            className="flex-1"
                          >
                            Rent
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete "${it.name}"? This action cannot be undone.`)) {
                                handleDelete(it.id);
                              }
                            }}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Rentals */}
      {assignments.filter(a => a.status === 'active' && (!filterDiverId || String(a.diver_id) === String(filterDiverId))).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Rentals {filterDiverId && `(${filterDiverId})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.filter(a => a.status === 'active' && (!filterDiverId || String(a.diver_id) === String(filterDiverId))).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{assignment.equipment_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Diver: {assignment.diver_name || 'Unknown'} | Qty: {assignment.quantity} | {assignment.check_in} to {assignment.check_out}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturnAssignment(assignment)}
                  >
                    Return
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug: Show ALL active rentals if embedded and filtering */}
      {embedded && filterDiverId && assignments.filter(a => a.status === 'active').length > 0 && (
        <Card className="bg-muted/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug: All Active Rentals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {assignments.filter(a => a.status === 'active').map((a) => (
                <div key={a.id} className="p-2 bg-background rounded border">
                  <p><strong>{a.equipment_name}</strong> → {a.diver_name || `diver_id: ${a.diver_id}`}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rental Dialog */}
      {!embedded ? (
        <Dialog open={openRental} onOpenChange={setOpenRental}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rent Equipment{selectedEquipmentForRental ? ` — ${selectedEquipmentForRental.name}` : ''}</DialogTitle>
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
                  if (!selectedEquipmentForRental) return;
                  if (!rentalForm.diver_id) { toast({ title: 'Error', description: 'Select a diver', variant: 'destructive' }); return; }
                  const max = selectedEquipmentForRental.quantity_available_for_rent ?? selectedEquipmentForRental.quantity_in_stock ?? 0;
                  if (rentalForm.quantity > max) { toast({ title: 'Error', description: 'Not enough available units', variant: 'destructive' }); return; }
                  try {
                    // ensure booking exists (use string diver_id)
                    const diverId = rentalForm.diver_id;
                    let bookingId = null;
                    try {
                      const allBookings = await apiClient.bookings.list().catch(() => []);
                      const diverBookings = Array.isArray(allBookings) ? allBookings.filter((b: any) => String(b.diver_id) === String(diverId)) : [];
                      if (diverBookings.length > 0) bookingId = diverBookings[0].id;
                    } catch (err) {}

                    if (!bookingId) {
                      const bk = await apiClient.bookings.create({ diver_id: diverId, check_in: rentalForm.check_in, check_out: rentalForm.check_out });
                      bookingId = bk.id;
                    }

                    await apiClient.rentalAssignments.create({ booking_id: bookingId, equipment_id: selectedEquipmentForRental.id, quantity: rentalForm.quantity, check_in: rentalForm.check_in, check_out: rentalForm.check_out });
                    const newAvail = Math.max(0, (selectedEquipmentForRental.quantity_available_for_rent || 0) - rentalForm.quantity);
                    const existingEq = items.find(i => i.id === selectedEquipmentForRental.id) || selectedEquipmentForRental;
                    const merged = { ...existingEq, quantity_available_for_rent: newAvail };
                    await apiClient.equipment.update(selectedEquipmentForRental.id, merged);
                    await load();
                    await loadAssignments();
                    if (props.onRentalCreated) props.onRentalCreated();
                    window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
                    setOpenRental(false);
                    toast({ title: 'Rented', description: `Rented ${rentalForm.quantity} x ${selectedEquipmentForRental.name}` });
                  } catch (err) {
                    console.error('Create rental failed', err);
                    toast({ title: 'Error', description: String(err), variant: 'destructive' });
                  }
                }}>Create Rental</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
        // Embedded inline modal to avoid nested Dialog conflicts
        openRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpenRental(false)} />
            <div ref={inlineModalRef} role="dialog" aria-modal="true" aria-label={selectedEquipmentForRental ? `Rent ${selectedEquipmentForRental.name}` : 'Rent equipment'} className="bg-card rounded-lg p-3 max-w-lg w-full max-h-[80vh] overflow-auto z-50">
              <div className="mb-3 text-lg font-semibold">Rent Equipment{selectedEquipmentForRental ? ` — ${selectedEquipmentForRental.name}` : ''}</div>
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
                    if (!selectedEquipmentForRental) return;
                    if (!rentalForm.diver_id) { toast({ title: 'Error', description: 'Select a diver', variant: 'destructive' }); return; }
                    const max = selectedEquipmentForRental.quantity_available_for_rent ?? selectedEquipmentForRental.quantity_in_stock ?? 0;
                    if (rentalForm.quantity > max) { toast({ title: 'Error', description: 'Not enough available units', variant: 'destructive' }); return; }
                    try {
                      const diverId = rentalForm.diver_id;
                      let bookingId = null;
                      try {
                        const allBookings = await apiClient.bookings.list().catch(() => []);
                        const diverBookings = Array.isArray(allBookings) ? allBookings.filter((b: any) => String(b.diver_id) === String(diverId)) : [];
                        if (diverBookings.length > 0) bookingId = diverBookings[0].id;
                      } catch (err) {}

                      if (!bookingId) {
                        const bk = await apiClient.bookings.create({ diver_id: diverId, check_in: rentalForm.check_in, check_out: rentalForm.check_out });
                        bookingId = bk.id;
                      }

                      await apiClient.rentalAssignments.create({ booking_id: bookingId, equipment_id: selectedEquipmentForRental.id, quantity: rentalForm.quantity, check_in: rentalForm.check_in, check_out: rentalForm.check_out });
                      const newAvail = Math.max(0, (selectedEquipmentForRental.quantity_available_for_rent || 0) - rentalForm.quantity);
                      const existingEq = items.find(i => i.id === selectedEquipmentForRental.id) || selectedEquipmentForRental;
                      const merged = { ...existingEq, quantity_available_for_rent: newAvail };
                      await apiClient.equipment.update(selectedEquipmentForRental.id, merged);
                      await load();
                      await loadAssignments();
                      if (props.onRentalCreated) props.onRentalCreated();
                      window.dispatchEvent(new Event('rentalAssignmentsUpdated'));
                      setOpenRental(false);
                      toast({ title: 'Rented', description: `Rented ${rentalForm.quantity} x ${selectedEquipmentForRental.name}` });
                    } catch (err) {
                      console.error('Create rental failed', err);
                      toast({ title: 'Error', description: String(err), variant: 'destructive' });
                    }
                  }}>Create Rental</Button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
