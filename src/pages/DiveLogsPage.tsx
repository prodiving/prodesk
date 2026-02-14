import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DiveLog, Diver, DiveSite } from "@/hooks/useDiveData";

interface Props {
  diveLogs: DiveLog[];
  divers: Diver[];
  diveSites: DiveSite[];
  onAdd: (log: Omit<DiveLog, "id">) => void;
  onDelete: (id: string) => void;
}

export default function DiveLogsPage({ diveLogs, divers, diveSites, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", site: "", depth: "", duration: "", diver: "", notes: "" });

  const handleSubmit = () => {
    if (!form.date || !form.site || !form.depth || !form.duration || !form.diver) return;
    onAdd({ date: form.date, site: form.site, depth: Number(form.depth), duration: Number(form.duration), diver: form.diver, notes: form.notes });
    setForm({ date: "", site: "", depth: "", duration: "", diver: "", notes: "" });
    setOpen(false);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Dive Logs</h1>
          <p className="page-description">Record and manage all dive activities</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Dive Log</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Dive Log</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Diver</Label>
                <Select value={form.diver} onValueChange={(v) => setForm({ ...form, diver: v })}>
                  <SelectTrigger><SelectValue placeholder="Select diver" /></SelectTrigger>
                  <SelectContent>
                    {divers.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Dive Site</Label>
                <Select value={form.site} onValueChange={(v) => setForm({ ...form, site: v })}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {diveSites.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Depth (m)</Label>
                  <Input type="number" value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
              <th>Date</th><th>Diver</th><th>Site</th><th>Depth</th><th>Duration</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            {diveLogs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No dive logs recorded yet</td></tr>
            ) : (
              diveLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="font-mono text-sm">{log.date}</td>
                  <td>{log.diver}</td>
                  <td className="font-medium">{log.site}</td>
                  <td className="font-mono">{log.depth}m</td>
                  <td className="font-mono">{log.duration} min</td>
                  <td className="text-muted-foreground">{log.notes}</td>
                  <td>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(log.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
