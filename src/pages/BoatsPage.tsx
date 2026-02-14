import { useState, useEffect } from "react";
import { Plus, Trash2, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Boat {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
}

export default function BoatsPage() {
  const [items, setItems] = useState<Boat[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: "10", description: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("boats").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    const { error } = await supabase.from("boats").insert({ name: form.name, capacity: Number(form.capacity) || 10, description: form.description || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ name: "", capacity: "10", description: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("boats").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Boats</h1>
          <p className="page-description">Manage dive boats and their capacity</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Boat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Boat</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSubmit}>Save Boat</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((b) => (
          <div key={b.id} className="bg-card rounded-lg border p-5 relative group">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(b.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Ship className="h-5 w-5 text-primary" />
              <p className="font-semibold">{b.name}</p>
            </div>
            <p className="text-sm">Capacity: <span className="font-mono font-medium">{b.capacity}</span></p>
            {b.description && <p className="text-sm text-muted-foreground mt-1">{b.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
