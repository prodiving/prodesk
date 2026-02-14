import { useState, useEffect } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function DiveLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", diver_id: "", site_id: "", depth: "", duration: "", time_in: "", time_out: "", boat_id: "", instructor_id: "", notes: "", safety_checklist_completed: false });
  const { toast } = useToast();

  const load = async () => {
    const [l, d, s, b, i] = await Promise.all([
      supabase.from("dive_logs").select("*, divers(name), dive_sites(name), boats(name), instructors(name)").order("date", { ascending: false }),
      supabase.from("divers").select("id, name"),
      supabase.from("dive_sites").select("id, name"),
      supabase.from("boats").select("id, name"),
      supabase.from("instructors").select("id, name"),
    ]);
    if (l.data) setLogs(l.data);
    if (d.data) setDivers(d.data);
    if (s.data) setSites(s.data);
    if (b.data) setBoats(b.data);
    if (i.data) setInstructors(i.data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.date || !form.diver_id || !form.site_id) return;
    const { error } = await supabase.from("dive_logs").insert({
      date: form.date, diver_id: form.diver_id, site_id: form.site_id,
      depth: Number(form.depth) || 0, duration: Number(form.duration) || 0,
      time_in: form.time_in || null, time_out: form.time_out || null,
      boat_id: form.boat_id || null, instructor_id: form.instructor_id || null,
      notes: form.notes || null, safety_checklist_completed: form.safety_checklist_completed,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ date: "", diver_id: "", site_id: "", depth: "", duration: "", time_in: "", time_out: "", boat_id: "", instructor_id: "", notes: "", safety_checklist_completed: false });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("dive_logs").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Dive Logs</h1>
          <p className="page-description">Record and manage all dive activities with time in/out</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Dive Log</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Dive Log</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Diver</Label>
                  <Select value={form.diver_id} onValueChange={(v) => setForm({ ...form, diver_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{divers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Dive Site</Label>
                  <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Depth (m)</Label><Input type="number" value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Time In</Label><Input type="time" value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Time Out</Label><Input type="time" value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Boat</Label>
                  <Select value={form.boat_id} onValueChange={(v) => setForm({ ...form, boat_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{boats.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Instructor</Label>
                  <Select value={form.instructor_id} onValueChange={(v) => setForm({ ...form, instructor_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.safety_checklist_completed} onCheckedChange={(v) => setForm({ ...form, safety_checklist_completed: !!v })} />
                <Label className="cursor-pointer"><CheckSquare className="h-4 w-4 inline mr-1" />Safety checklist completed</Label>
              </div>
              <Button onClick={handleSubmit}>Save Dive Log</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/50">
              <th>Date</th><th>Diver</th><th>Site</th><th>Depth</th><th>Duration</th><th>Time In/Out</th><th>Boat</th><th>Safety</th><th></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No dive logs recorded yet</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="font-mono text-sm">{log.date}</td>
                <td>{log.divers?.name || "—"}</td>
                <td className="font-medium">{log.dive_sites?.name || "—"}</td>
                <td className="font-mono">{log.depth}m</td>
                <td className="font-mono">{log.duration} min</td>
                <td className="text-sm">{log.time_in || "—"} → {log.time_out || "—"}</td>
                <td className="text-sm">{log.boats?.name || "—"}</td>
                <td>{log.safety_checklist_completed ? "✅" : "⚠️"}</td>
                <td>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
