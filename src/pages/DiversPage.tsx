import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

const certificationOptions = [
  "PADI Open Water", "PADI Advanced Open Water", "PADI Rescue Diver", "PADI Divemaster",
  "SSI Open Water", "SSI Advanced", "NAUI Scuba Diver",
  "CMAS 1 Star", "CMAS 2 Star", "CMAS 3 Star"
];

export default function DiversPage() {
  const [divers, setDivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    certification_level: "",
    medical_cleared: true,
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
        name: diver.name || "",
        email: diver.email || "",
        phone: diver.phone || "",
        certification_level: diver.certification_level || "",
        medical_cleared: diver.medical_cleared === 1 || diver.medical_cleared === true,
      });
    } else {
      setEditingId(null);
      setForm({ name: "", email: "", phone: "", certification_level: "", medical_cleared: true });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        ...form,
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
          <p className="page-description">Manage diver profiles, certifications, and waivers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Diver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Diver" : "New Diver"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" />
              </div>
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
                <input type="checkbox" id="medical" checked={form.medical_cleared} onChange={(e) => setForm({ ...form, medical_cleared: e.target.checked })} />
                <Label htmlFor="medical" className="!mt-0">Medical clearance obtained</Label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {divers.map((diver) => (
          <Card key={diver.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold">{diver.name}</h3>
                <p className="text-sm text-muted-foreground">{diver.email}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenForm(diver)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(diver.id, diver.name)}>
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

              {/* Waiver Status */}
              <div className="flex items-center gap-2 text-sm">
                {diver.waiver_signed ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
                <span className="text-muted-foreground">
                  {diver.waiver_signed ? `Waiver signed (${new Date(diver.waiver_signed_date).toLocaleDateString()})` : "Waiver pending"}
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
                  onClick={() => handleCompleteOnboarding(diver.id, diver.name)}
                >
                  Complete Onboarding
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {divers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-3">No divers yet</p>
          <Button onClick={() => handleOpenForm()}>Add First Diver</Button>
        </div>
      )}
    </div>
  );
}
