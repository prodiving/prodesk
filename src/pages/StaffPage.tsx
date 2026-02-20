import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string; // 'instructor', 'divemaster', 'boat_staff'
  certification: string | null;
  specialties: string | null;
  certifications_valid_until: string | null;
  availability: string | null; // 'available', 'unavailable'
  created_at: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('instructors');
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    role: "instructor",
    certification: "", 
    specialties: "",
    certifications_valid_until: "",
    availability: "available"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/staff`);
      if (!response.ok) throw new Error('Failed to load staff');
      const data = await response.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading staff:', err);
      toast({ title: 'Error', description: 'Failed to load staff', variant: 'destructive' });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleSubmit = async () => {
    if (!form.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    try {
      const endpoint = editingId ? `${BASE_URL}/api/staff/${editingId}` : `${BASE_URL}/api/staff`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Failed to save staff member');
      
      toast({ 
        title: 'Success', 
        description: editingId ? 'Staff member updated' : 'Staff member added' 
      });
      
      setForm({ 
        name: "", 
        email: "", 
        phone: "",
        role: "instructor",
        certification: "", 
        specialties: "",
        certifications_valid_until: "",
        availability: "available"
      });
      setEditingId(null);
      setOpen(false);
      await loadStaff();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const handleEdit = (member: StaffMember) => {
    setForm({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      certification: member.certification || "",
      specialties: member.specialties || "",
      certifications_valid_until: member.certifications_valid_until || "",
      availability: member.availability || "available"
    });
    setEditingId(member.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      const response = await fetch(`${BASE_URL}/api/staff/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast({ title: 'Success', description: 'Staff member deleted' });
      await loadStaff();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const filterByRole = (role: string) => staff.filter(s => s.role === role);

  const StaffCard = ({ member }: { member: StaffMember }) => (
    <div key={member.id} className="bg-card rounded-lg border p-4 relative group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold">{member.name}</p>
          <Badge variant={member.availability === 'available' ? 'secondary' : 'destructive'} className="text-xs mt-1">
            {member.availability === 'available' ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      {member.email && <p className="text-xs text-muted-foreground mb-1">{member.email}</p>}
      {member.phone && <p className="text-xs text-muted-foreground mb-2">{member.phone}</p>}
      
      {member.certification && <p className="text-sm mt-2"><strong>Cert:</strong> {member.certification}</p>}
      {member.specialties && <p className="text-sm text-muted-foreground mt-1">{member.specialties}</p>}
      
      {member.certifications_valid_until && (
        <p className="text-xs mt-2 text-muted-foreground">
          Valid until: {new Date(member.certifications_valid_until).toLocaleDateString()}
        </p>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-description">Manage instructors, divemasters, and boat staff</p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          if (!newOpen) {
            setEditingId(null);
            setForm({ name: "", email: "", phone: "", role: activeTab === 'instructors' ? 'instructor' : activeTab === 'divemasters' ? 'divemaster' : 'boat_staff', certification: "", specialties: "", certifications_valid_until: "", availability: "available" });
          }
          setOpen(newOpen);
        }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />{editingId ? 'Edit' : 'Add'} Staff</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              
              <div className="grid gap-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="divemaster">Divemaster</SelectItem>
                    <SelectItem value="boat_staff">Boat Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Certification</Label>
                <Input value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} placeholder="e.g., PADI Instructor" />
              </div>

              <div className="grid gap-2">
                <Label>Specialties</Label>
                <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="e.g., Deep Diving, Rescue" />
              </div>

              <div className="grid gap-2">
                <Label>Certifications Valid Until</Label>
                <Input type="date" value={form.certifications_valid_until} onChange={(e) => setForm({ ...form, certifications_valid_until: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>Availability</Label>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Staff Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instructors">Instructors ({filterByRole('instructor').length})</TabsTrigger>
            <TabsTrigger value="divemasters">Divemasters ({filterByRole('divemaster').length})</TabsTrigger>
            <TabsTrigger value="boat_staff">Boat Staff ({filterByRole('boat_staff').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="instructors" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByRole('instructor').length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">No instructors added yet</p>
              ) : (
                filterByRole('instructor').map(member => <StaffCard key={member.id} member={member} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="divemasters" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByRole('divemaster').length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">No divemasters added yet</p>
              ) : (
                filterByRole('divemaster').map(member => <StaffCard key={member.id} member={member} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="boat_staff" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterByRole('boat_staff').length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">No boat staff added yet</p>
              ) : (
                filterByRole('boat_staff').map(member => <StaffCard key={member.id} member={member} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
