import { useState, useEffect } from "react";
import { Plus, Trash2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AccommodationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tier: "free_with_course", price_per_night: "0", description: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("accommodations").select("*").order("price_per_night");
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    const { error } = await supabase.from("accommodations").insert({
      name: form.name,
      tier: form.tier as any,
      price_per_night: Number(form.price_per_night) || 0,
      description: form.description || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ name: "", tier: "free_with_course", price_per_night: "0", description: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("accommodations").delete().eq("id", id);
    load();
  };

  const tierLabels: Record<string, string> = { free_with_course: "Free with Course", standard: "Standard", deluxe: "Deluxe" };
  const tierColors: Record<string, string> = { free_with_course: "bg-success/20 text-success", standard: "bg-info/20 text-info", deluxe: "bg-warning/20 text-warning" };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Accommodations</h1>
          <p className="page-description">Manage room options from free with course to deluxe upgrade</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Accommodation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Accommodation</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_with_course">Free with Course</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Price per Night ($)</Label><Input type="number" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSubmit}>Save Accommodation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((a) => (
          <div key={a.id} className="bg-card rounded-lg border p-5 relative group">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(a.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <Home className="h-5 w-5 text-primary" />
              <p className="font-semibold">{a.name}</p>
            </div>
            <Badge variant="outline" className={tierColors[a.tier] || ""}>{tierLabels[a.tier] || a.tier}</Badge>
            <p className="text-2xl font-bold mt-3">{a.price_per_night === 0 ? "Free" : `$${a.price_per_night}/night`}</p>
            {a.description && <p className="text-sm text-muted-foreground mt-2">{a.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
