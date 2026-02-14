import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Instructor {
  id: string;
  name: string;
  email: string | null;
  certification: string | null;
  specialties: string | null;
}

export default function InstructorsPage() {
  const [items, setItems] = useState<Instructor[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", certification: "", specialties: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("instructors").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    const { error } = await supabase.from("instructors").insert({ name: form.name, email: form.email || null, certification: form.certification || null, specialties: form.specialties || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ name: "", email: "", certification: "", specialties: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("instructors").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Instructors</h1>
          <p className="page-description">Manage dive instructors and their certifications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Instructor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Instructor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Certification</Label><Input value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Specialties</Label><Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} /></div>
              <Button onClick={handleSubmit}>Save Instructor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div key={i.id} className="bg-card rounded-lg border p-5 relative group">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(i.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <p className="font-semibold">{i.name}</p>
            {i.email && <p className="text-xs text-muted-foreground">{i.email}</p>}
            {i.certification && <p className="text-sm mt-2">{i.certification}</p>}
            {i.specialties && <p className="text-sm text-muted-foreground">{i.specialties}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
