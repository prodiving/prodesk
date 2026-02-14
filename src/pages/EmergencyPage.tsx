import { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function EmergencyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", procedure_type: "general", steps: "" });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("emergency_procedures").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    const { error } = await supabase.from("emergency_procedures").insert(form);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ title: "", description: "", procedure_type: "general", steps: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("emergency_procedures").delete().eq("id", id);
    load();
  };

  const typeColors: Record<string, string> = {
    medical: "bg-destructive/20 text-destructive border-destructive/30",
    search: "bg-warning/20 text-warning border-warning/30",
    equipment: "bg-info/20 text-info border-info/30",
    general: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Emergency Procedures</h1>
          <p className="page-description">Safety protocols and emergency response plans</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Procedure</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Emergency Procedure</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Type</Label><Input value={form.procedure_type} onChange={(e) => setForm({ ...form, procedure_type: e.target.value })} placeholder="medical, search, equipment, general" /></div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Steps (one per line)</Label><Textarea rows={5} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} /></div>
              <Button onClick={handleSubmit}>Save Procedure</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {items.map((p) => (
          <div key={p.id} className="bg-card rounded-lg border p-5 relative group">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(p.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="font-semibold">{p.title}</p>
              <Badge variant="outline" className={typeColors[p.procedure_type] || typeColors.general}>{p.procedure_type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
            {p.steps && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Steps</p>
                <pre className="text-sm whitespace-pre-wrap">{p.steps}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
