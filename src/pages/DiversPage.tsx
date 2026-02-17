import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, CheckCircle, Clock, Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/integrations/api/client";
import EquipmentMaintenancePage from '@/pages/EquipmentMaintenancePage';
import { useToast } from "@/hooks/use-toast";

const certificationOptions = [
  "Not Certified",
  "PADI Open Water", "PADI Advanced Open Water", "PADI Rescue Diver", "PADI Divemaster",
  "SSI Open Water", "SSI Advanced", "NAUI Scuba Diver",
  "CMAS 1 Star", "CMAS 2 Star", "CMAS 3 Star",
  "DSD (Discover Scuba Diving)",
  "Snorkelling"
];

export default function DiversPage() {
  const [divers, setDivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDiver, setSelectedDiver] = useState<any>(null);
  const [selectedDiverBookings, setSelectedDiverBookings] = useState<any[]>([]);
  const [selectedDiverAssignments, setSelectedDiverAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    surname: "",
    sex: "",
    date_of_birth_month: "",
    date_of_birth_day: "",
    date_of_birth_year: "",
    passport_number: "",
    passport_country: "",
    email: "",
    phone: "",
    certification_level: "",
    medical_cleared: true,
    notes: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [openEquipmentModal, setOpenEquipmentModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.divers.list();
      setDivers(data);
    } catch (err) {
      console.error('Failed to load divers', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDiverDetails = async (diver: any) => {
    try {
      // Fetch bookings for this diver
      const allBookings = await apiClient.bookings.list().catch(() => []);
      const diverBookings = Array.isArray(allBookings) ? 
        allBookings.filter((b: any) => b.diver_id === diver.id || b.divers?.id === diver.id) : 
        [];
      setSelectedDiverBookings(diverBookings);
      // Fetch rental assignments and filter by diver
      const allAssignments = await apiClient.rentalAssignments.list('').catch(() => []);
      const diverAssigns = Array.isArray(allAssignments) ? allAssignments.filter((a:any) => String(a.diver_id) === String(diver.id) || String(a.diver_name) === String(diver.name)) : [];
      setSelectedDiverAssignments(diverAssigns);
    } catch (err) {
      console.error('Failed to load diver bookings', err);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = () => { if (selectedDiver) loadDiverDetails(selectedDiver); };
    window.addEventListener('rentalAssignmentsUpdated', handler);
    return () => window.removeEventListener('rentalAssignmentsUpdated', handler);
  }, [selectedDiver]);

  const handleOpenForm = (diver?: any) => {
    if (diver) {
      setEditingId(diver.id);
      setForm({
        first_name: diver.first_name || diver.name?.split(' ')[0] || "",
        middle_name: diver.middle_name || "",
        surname: diver.surname || diver.name?.split(' ').slice(-1)[0] || "",
        sex: diver.sex || "",
        date_of_birth_month: diver.date_of_birth_month || "",
        date_of_birth_day: diver.date_of_birth_day || "",
        date_of_birth_year: diver.date_of_birth_year || "",
        passport_number: diver.passport_number || "",
        passport_country: diver.passport_country || "",
        email: diver.email || "",
        phone: diver.phone || "",
        certification_level: diver.certification_level || "",
        medical_cleared: diver.medical_cleared === 1 || diver.medical_cleared === true,
        notes: diver.notes || "",
      });
      setSelectedDiver(diver);
      setActiveTab("summary");
    } else {
      setEditingId(null);
      setForm({ 
        first_name: "", middle_name: "", surname: "", sex: "", 
        date_of_birth_month: "", date_of_birth_day: "", date_of_birth_year: "",
        passport_number: "", passport_country: "", email: "", phone: "", 
        certification_level: "", medical_cleared: true, notes: "" 
      });
      setSelectedDiver(null);
    }
    setOpen(true);
  };

  const handleSelectDiver = (diver: any) => {
    setSelectedDiver(diver);
    loadDiverDetails(diver);
    setActiveTab("summary");
  };

  const startEditingField = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue });
  };

  const saveFieldEdit = async (field: string) => {
    if (!selectedDiver) return;
    try {
      const updateData: any = {};
      updateData[field] = editValues[field];
      
      // For full payload, include all current diver data to avoid API rejecting partial updates
      const fullPayload = {
        ...selectedDiver,
        ...updateData,
        medical_cleared: selectedDiver.medical_cleared === 1 || selectedDiver.medical_cleared === true ? 1 : 0,
      };
      
      await apiClient.divers.update(selectedDiver.id, fullPayload);
      const updatedDiver = { ...selectedDiver, [field]: editValues[field] };
      setSelectedDiver(updatedDiver);
      setEditingField(null);
      toast({ title: "Success", description: "Updated successfully" });
      load();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.surname || !form.email) {
      toast({ title: "Error", description: "First name, surname, and email are required", variant: "destructive" });
      return;
    }

    try {
      const fullName = `${form.first_name} ${form.middle_name} ${form.surname}`.trim().replace(/\s+/g, ' ');
      const payload = {
        ...form,
        name: fullName,
        medical_cleared: form.medical_cleared === true ? 1 : 0,
      };
      
      if (editingId) {
        await apiClient.divers.update(editingId, payload);
        toast({ title: "Success", description: "Diver updated successfully" });
      } else {
        await apiClient.divers.create(payload);
        toast({ title: "Success", description: "Diver created successfully" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete diver "${name}"?`)) return;
    try {
      await apiClient.divers.delete(id);
      toast({ title: "Success", description: "Diver deleted successfully" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const handleCompleteOnboarding = async (id: string, name: string) => {
    try {
      await apiClient.divers.completeOnboarding(id);
      toast({ title: "Success", description: `${name}'s onboarding completed` });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <Dialog open={openEquipmentModal} onOpenChange={setOpenEquipmentModal}>
        <DialogContent className="max-w-6xl w-full p-0">
          <div className="h-screen">
            <EquipmentMaintenancePage 
              initialDiverId={selectedDiver?.id} 
              embedded={true}
              onRentalCreated={() => { if (selectedDiver) loadDiverDetails(selectedDiver); }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Divers</h1>
          <p className="page-description">Manage diver profiles, certifications, and equipment</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Diver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>{editingId ? "Edit Diver" : "Create Diver"}</DialogTitle>
              <Button variant="outline" size="sm">
                CSV Import
              </Button>
            </DialogHeader>
            
            <div className="flex">
              {/* Left side - Form */}
              <div className="flex-1 pr-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="contact">Contact Info</TabsTrigger>
                    <TabsTrigger value="diving">Diving Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" />
                      </div>
                      <div>
                        <Label>Middle</Label>
                        <Input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} placeholder="Middle name" />
                      </div>
                      <div>
                        <Label>Surname *</Label>
                        <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} placeholder="Surname" />
                      </div>
                      <div>
                        <Label>Sex</Label>
                        <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Date of Birth</Label>
                        <div className="flex gap-2">
                          <Select value={form.date_of_birth_month} onValueChange={(v) => setForm({ ...form, date_of_birth_month: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={form.date_of_birth_day} onValueChange={(v) => setForm({ ...form, date_of_birth_day: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 31}, (_, i) => i + 1).map((d) => (
                                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={form.date_of_birth_year} onValueChange={(v) => setForm({ ...form, date_of_birth_year: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Passport Number</Label>
                        <Input value={form.passport_number} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} placeholder="Passport number" />
                      </div>
                      <div>
                        <Label>Passport Country</Label>
                        <Input value={form.passport_country} onChange={(e) => setForm({ ...form, passport_country: e.target.value })} placeholder="Country" />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <textarea 
                        className="w-full p-3 border rounded-md resize-none min-h-[80px]" 
                        value={form.notes} 
                        onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                        placeholder="Additional notes..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Email *</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="diving" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Certification Level</Label>
                        <Select value={form.certification_level} onValueChange={(v) => setForm({ ...form, certification_level: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select certification..." />
                          </SelectTrigger>
                          <SelectContent>
                            {certificationOptions.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="medical" 
                          checked={form.medical_cleared} 
                          onChange={(e) => setForm({ ...form, medical_cleared: e.target.checked })} 
                        />
                        <Label htmlFor="medical" className="!mt-0">Medical clearance obtained</Label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right side - Help Guide */}
              <div className="w-80 pl-6 border-l">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Help Guide</h3>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <p>Digital diver records help you:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>Store contact information securely</li>
                      <li>Track diving history and certifications</li>
                      <li>Assign divers to dive trips easily</li>
                      <li>Monitor medical clearance status</li>
                      <li>Manage equipment rentals</li>
                      <li>Generate reports and documentation</li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="text-xs"><strong>Tip:</strong> Complete all fields for accurate diver profiles and better trip management.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedDiver ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Diving Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Personal Info</h4>
                  <p className="text-sm text-muted-foreground">Name: {selectedDiver.name}</p>
                  <p className="text-sm text-muted-foreground">Email: {selectedDiver.email}</p>
                  <p className="text-sm text-muted-foreground">Phone: {selectedDiver.phone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Diving Info</h4>
                  <p className="text-sm text-muted-foreground">Certification: {selectedDiver.certification_level || 'Not certified'}</p>
                  <p className="text-sm text-muted-foreground">Medical: {selectedDiver.medical_cleared ? 'Cleared' : 'Pending'}</p>
                  <p className="text-sm text-muted-foreground">Onboarding: {selectedDiver.onboarding_completed ? 'Completed' : 'Pending'}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Info</h3>
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  {editingField === 'name' ? (
                    <div className="flex gap-2">
                      <Input value={editValues.name} onChange={(e) => setEditValues({...editValues, name: e.target.value})} />
                      <Button size="sm" onClick={() => saveFieldEdit('name')}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('name', selectedDiver.name)}>
                      <Input value={selectedDiver.name} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  {editingField === 'email' ? (
                    <div className="flex gap-2">
                      <Input value={editValues.email} onChange={(e) => setEditValues({...editValues, email: e.target.value})} />
                      <Button size="sm" onClick={() => saveFieldEdit('email')}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('email', selectedDiver.email)}>
                      <Input value={selectedDiver.email} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Phone</Label>
                  {editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <Input value={editValues.phone || ''} onChange={(e) => setEditValues({...editValues, phone: e.target.value})} />
                      <Button size="sm" onClick={() => saveFieldEdit('phone')}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('phone', selectedDiver.phone)}>
                      <Input value={selectedDiver.phone || ''} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Certification Level</Label>
                  {editingField === 'certification_level' ? (
                    <div className="flex gap-2">
                      <Select value={editValues.certification_level || ''} onValueChange={(v) => setEditValues({...editValues, certification_level: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {certificationOptions.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => saveFieldEdit('certification_level')}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('certification_level', selectedDiver.certification_level)}>
                      <Input value={selectedDiver.certification_level || ''} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-3">
                <div>
                  <Label>Email</Label>
                  {editingField === 'email' ? (
                    <div className="flex gap-2">
                      <Input value={editValues.email} onChange={(e) => setEditValues({...editValues, email: e.target.value})} />
                      <Button size="sm" onClick={() => saveFieldEdit('email')}>Save</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('email', selectedDiver.email)}>
                      <Input value={selectedDiver.email} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Phone</Label>
                  {editingField === 'phone' ? (
                    <div className="flex gap-2">
                      <Input value={editValues.phone || ''} onChange={(e) => setEditValues({...editValues, phone: e.target.value})} />
                      <Button size="sm" onClick={() => saveFieldEdit('phone')}>Save</Button>
                    </div>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => startEditingField('phone', selectedDiver.phone)}>
                      <Input value={selectedDiver.phone || ''} readOnly className="cursor-pointer" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Equipment Rentals</h3>
                <div>
                  <Button size="sm" onClick={() => setOpenEquipmentModal(true)}>
                    Manage Equipment
                  </Button>
                </div>
              </div>
              {selectedDiverAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No rentals for this diver.</div>
              ) : (
                <div className="space-y-3">
                  {selectedDiverAssignments.map((a) => (
                    <div key={a.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{a.equipment_name || a.equipment_id}</div>
                          <div className="text-sm text-muted-foreground">{a.quantity} · {a.check_in} → {a.check_out}</div>
                        </div>
                        <Badge variant={a.status === 'active' ? 'secondary' : 'destructive'}>{a.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Courses & Certifications</h3>
              </div>
              {selectedDiverBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No courses booked yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDiverBookings.map((booking: any) => (
                    <div key={booking.id} className="border rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.courses?.name || 'Fun Dive'}</h4>
                          <p className="text-sm text-muted-foreground">Check-in: {new Date(booking.check_in).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">Instructor: {booking.instructor?.name || 'N/A'}</p>
                          {booking.courses?.description && (
                            <p className="text-sm text-muted-foreground mt-2">{booking.courses.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {booking.payment_status === 'paid' ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bookings & Trips</h3>
              {selectedDiverBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No bookings found for this diver.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDiverBookings.map((booking: any) => (
                    <div key={booking.id} className="border rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.courses?.name || 'Fun Dive'}</h4>
                          <p className="text-sm text-muted-foreground">Check-in: {new Date(booking.check_in).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">Check-out: {booking.check_out ? new Date(booking.check_out).toLocaleDateString() : 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Agent: {booking.agent?.name || 'N/A'}</p>
                        </div>
                        <Badge variant={booking.payment_status === 'paid' ? 'default' : 'outline'}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Invoices & Payments</h3>
              {selectedDiverBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment history for this diver.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDiverBookings.map((booking: any) => (
                    <div key={booking.id} className="border rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">Invoice #{booking.id?.slice(0, 8)}</h4>
                          <p className="text-sm text-muted-foreground">Course: {booking.courses?.name || 'Fun Dive'}</p>
                          <p className="text-sm text-muted-foreground">Date: {new Date(booking.check_in).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">Amount: ${booking.total_amount || 0}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={booking.payment_status === 'paid' ? 'default' : 'destructive'}>
                            {booking.payment_status?.toUpperCase() || 'PENDING'}
                          </Badge>
                          {booking.payment_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Paid: {new Date(booking.payment_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Forms</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">Medical Form</h4>
                    <p className="text-sm text-muted-foreground">PADI Medical Statement</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://drive.google.com/file/d/1PrpW7MAlWJFAepWbF7ab8SKPd1jlPnY5/view?usp=drive_link', '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">Waiver Form</h4>
                    <p className="text-sm text-muted-foreground">Liability Release</p>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              <div className="text-center py-8 text-muted-foreground">
                <p>Certificates and documents will be shown here.</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divers.map((diver) => (
            <Card key={diver.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectDiver(diver)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{diver.name}</h3>
                  <p className="text-sm text-muted-foreground">{diver.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenForm(diver); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDelete(diver.id, diver.name); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {diver.phone && (
                <p className="text-sm text-muted-foreground mb-2">📞 {diver.phone}</p>
              )}

              {diver.certification_level && (
                <Badge variant="outline" className="mb-3">{diver.certification_level}</Badge>
              )}

              <div className="space-y-2 mt-3 pt-3 border-t">
                {/* Medical Clearance */}
                <div className="flex items-center gap-2 text-sm">
                  {diver.medical_cleared ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-muted-foreground">
                    {diver.medical_cleared ? "Medical cleared" : "Pending medical clearance"}
                  </span>
                </div>

                {/* Onboarding Status */}
                <div className="flex items-center gap-2 text-sm">
                  {diver.onboarding_completed ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-muted-foreground">
                    {diver.onboarding_completed ? `Onboarding completed` : "Onboarding pending"}
                  </span>
                </div>

                {/* Complete Onboarding Button */}
                {!diver.onboarding_completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={(e) => { e.stopPropagation(); handleCompleteOnboarding(diver.id, diver.name); }}
                  >
                    Complete Onboarding
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {divers.length === 0 && !selectedDiver && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-3">No divers yet</p>
          <Button onClick={() => handleOpenForm()}>Add First Diver</Button>
        </div>
      )}

      {selectedDiver && (
        <div className="mt-4">
          <Button variant="outline" onClick={() => setSelectedDiver(null)}>
            ← Back to All Divers
          </Button>
        </div>
      )}
    </div>
  );
}
