import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DiveSite } from "@/hooks/useDiveData";

interface Props {
  diveSites: DiveSite[];
  onAdd: (site: Omit<DiveSite, "id">) => void;
  onDelete: (id: string) => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-success/20 text-success border-success/30",
  moderate: "bg-info/20 text-info border-info/30",
  challenging: "bg-warning/20 text-warning border-warning/30",
  expert: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function DiveSitesPage({ diveSites, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", maxDepth: "", difficulty: "" as DiveSite["difficulty"] | "", description: "" });

  const handleSubmit = () => {
    if (!form.name || !form.location || !form.maxDepth || !form.difficulty) return;
    onAdd({
      name: form.name,
      location: form.location,
      maxDepth: Number(form.maxDepth),
      difficulty: form.difficulty as DiveSite["difficulty"],
      description: form.description,
    });
    setForm({ name: "", location: "", maxDepth: "", difficulty: "", description: "" });
    setOpen(false);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Dive Sites</h1>
          <p className="page-description">Manage dive locations and difficulty ratings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Dive Site</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Dive Site</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Depth (m)</Label>
                  <Input type="number" value={form.maxDepth} onChange={(e) => setForm({ ...form, maxDepth: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as DiveSite["difficulty"] })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(["easy", "moderate", "challenging", "expert"] as const).map((d) => (
                        <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={handleSubmit}>Save Dive Site</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {diveSites.map((site) => (
          <div key={site.id} className="bg-card rounded-lg border p-5 relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(site.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{site.name}</p>
                <p className="text-xs text-muted-foreground">{site.location}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{site.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`capitalize ${difficultyColors[site.difficulty]}`}>
                {site.difficulty}
              </Badge>
              <span className="text-sm font-mono">Max {site.maxDepth}m</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
