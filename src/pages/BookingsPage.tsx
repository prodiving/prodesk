import { useState, useEffect } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ diver_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", total_amount: "0", notes: "" });
  const { toast } = useToast();

  const load = async () => {
    const [b, d, c, a] = await Promise.all([
      supabase.from("bookings").select("*, divers(name), courses(name, price), accommodations(name, price_per_night, tier)").order("created_at", { ascending: false }),
      supabase.from("divers").select("id, name"),
      supabase.from("courses").select("id, name, price"),
      supabase.from("accommodations").select("id, name, price_per_night, tier"),
    ]);
    if (b.data) setBookings(b.data);
    if (d.data) setDivers(d.data);
    if (c.data) setCourses(c.data);
    if (a.data) setAccommodations(a.data);
  };

  useEffect(() => { load(); }, []);

  const calcTotal = () => {
    let total = 0;
    const course = courses.find((c) => c.id === form.course_id);
    if (course) total += Number(course.price);
    const acc = accommodations.find((a) => a.id === form.accommodation_id);
    if (acc && form.check_in && form.check_out) {
      const nights = Math.max(1, Math.ceil((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000));
      total += Number(acc.price_per_night) * nights;
    }
    return total;
  };

  const handleSubmit = async () => {
    if (!form.diver_id) return;
    const total = calcTotal();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("bookings").insert({
      diver_id: form.diver_id,
      course_id: form.course_id || null,
      accommodation_id: form.accommodation_id || null,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      total_amount: total,
      invoice_number: invoiceNumber,
      payment_status: "unpaid",
      notes: form.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm({ diver_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", total_amount: "0", notes: "" });
    setOpen(false);
    load();
  };

  const togglePayment = async (id: string, current: string) => {
    const next = current === "paid" ? "unpaid" : "paid";
    await supabase.from("bookings").update({ payment_status: next }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
    load();
  };

  const statusColors: Record<string, string> = {
    paid: "bg-success/20 text-success border-success/30",
    unpaid: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings & Invoices</h1>
          <p className="page-description">Manage course bookings, accommodations, and payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Booking</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Diver</Label>
                <Select value={form.diver_id} onValueChange={(v) => setForm({ ...form, diver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select diver" /></SelectTrigger>
                  <SelectContent>{divers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (${c.price})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Accommodation</Label>
                <Select value={form.accommodation_id} onValueChange={(v) => setForm({ ...form, accommodation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select accommodation" /></SelectTrigger>
                  <SelectContent>{accommodations.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.tier === "free_with_course" ? "Free" : `$${a.price_per_night}/night`})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Check In</Label><Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Check Out</Label><Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${calcTotal()}</p>
              </div>
              <Button onClick={handleSubmit}>Create Booking & Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/50">
              <th>Invoice #</th><th>Diver</th><th>Course</th><th>Accommodation</th><th>Dates</th><th>Total</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No bookings yet</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                <td className="font-mono text-sm"><FileText className="h-3 w-3 inline mr-1" />{b.invoice_number || "—"}</td>
                <td>{b.divers?.name || "—"}</td>
                <td>{b.courses?.name || "—"}</td>
                <td>{b.accommodations?.name || "—"}</td>
                <td className="text-sm">{b.check_in || "—"} → {b.check_out || "—"}</td>
                <td className="font-mono font-medium">${b.total_amount}</td>
                <td>
                  <Badge variant="outline" className={`cursor-pointer ${statusColors[b.payment_status]}`} onClick={() => togglePayment(b.id, b.payment_status)}>
                    {b.payment_status}
                  </Badge>
                </td>
                <td>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
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
