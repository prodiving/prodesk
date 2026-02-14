import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const skillColors: Record<string, string> = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-info/20 text-info border-info/30",
  advanced: "bg-warning/20 text-warning border-warning/30",
  expert: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function DiversPage() {
  const [divers, setDivers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", certification: "", skillLevel: "", totalDives: "", emergency_contact_name: "", emergency_contact_phone: "", medical_conditions: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("divers").select("*").order("created_at", { ascending: false });
    if (data) setDivers(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.certification || !form.skillLevel) return;
    const { error } = await supabase.from("divers").insert({
      name: form.name, email: form.email || null, certification: form.certification,
      skill_level: form.skillLevel, total_dives: Number(form.totalDives) || 0,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      medical_conditions: form.medical_conditions || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ name: "", email: "", certification: "", skillLevel: "", totalDives: "", emergency_contact_name: "", emergency_contact_phone: "", medical_conditions: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("divers").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Divers</h1>
          <p className="page-description">Manage diver profiles, certifications and skill levels</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Diver</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Diver</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Certification</Label>
                <Select value={form.certification} onValueChange={(v) => setForm({ ...form, certification: v })}>
                  <SelectTrigger><SelectValue placeholder="Select certification" /></SelectTrigger>
                  <SelectContent>
                    {["PADI Open Water", "PADI Advanced Open Water", "PADI Rescue Diver", "PADI Divemaster", "SSI Open Water", "SSI Advanced", "NAUI Scuba Diver", "CMAS 1 Star", "CMAS 2 Star", "CMAS 3 Star"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Skill Level</Label>
                  <Select value={form.skillLevel} onValueChange={(v) => setForm({ ...form, skillLevel: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["beginner", "intermediate", "advanced", "expert"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Total Dives</Label><Input type="number" value={form.totalDives} onChange={(e) => setForm({ ...form, totalDives: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Emergency Contact</Label><Input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Contact name" /></div>
                <div className="grid gap-2"><Label>Emergency Phone</Label><Input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="Phone number" /></div>
              </div>
              <div className="grid gap-2"><Label>Medical Conditions</Label><Input value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} placeholder="Any relevant conditions" /></div>
              <Button onClick={handleSubmit}>Save Diver</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {divers.map((diver) => (
          <div key={diver.id} className="bg-card rounded-lg border p-5 relative group">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(diver.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {diver.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold">{diver.name}</p>
                <p className="text-xs text-muted-foreground">{diver.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Certification</span><span className="font-medium">{diver.certification}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Skill Level</span>
                <Badge variant="outline" className={`capitalize ${skillColors[diver.skill_level]}`}>{diver.skill_level}</Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Dives</span><span className="font-mono font-medium">{diver.total_dives}</span></div>
              {diver.emergency_contact_name && (
                <div className="flex justify-between"><span className="text-muted-foreground">Emergency</span><span className="text-xs">{diver.emergency_contact_name} {diver.emergency_contact_phone}</span></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
