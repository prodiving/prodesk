import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("summary");
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

  useEffect(() => { load(); }, []);

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
                  <Input value={selectedDiver.name} readOnly />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input placeholder="Not provided" readOnly />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input placeholder="Not provided" readOnly />
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
                  <Input value={selectedDiver.email} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={selectedDiver.phone || ''} readOnly />
                </div>
                <div>
                  <Label>Emergency Contact</Label>
                  <Input placeholder="Not provided" readOnly />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Equipment</h3>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Equipment rental history and assignments will be shown here.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/equipment-maintenance'}>
                  View Equipment Management
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Courses</h3>
              <div className="text-center py-8 text-muted-foreground">
                <p>Course enrollment and certification history will be shown here.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Trips</h3>
              <div className="text-center py-8 text-muted-foreground">
                <p>Dive trips and excursions will be shown here.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Invoices</h3>
              <div className="text-center py-8 text-muted-foreground">
                <p>Payment history and invoices will be shown here.</p>
              </div>
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
            <Card key={diver.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDiver(diver)}>
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
