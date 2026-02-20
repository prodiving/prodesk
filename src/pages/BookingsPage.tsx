import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, FileText, Download, Printer, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { generateInvoicePDF, printInvoice } from "@/utils/invoiceGenerator";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState({ booking_count: 0, total_revenue: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [form, setForm] = useState({ booking_type: "course", diver_id: "", group_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "", size: "", weight: "", height: "", agent_id: "", divemaster_id: "", boat_staff_id: "" });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [b, d, g, c, a, s, ins] = await Promise.all([
        apiClient.bookings.list(),
        apiClient.divers.list(),
        apiClient.groups.list(),
        apiClient.courses.list(),
        apiClient.accommodations.list(),
        apiClient.bookings.getLast30Days(),
        apiClient.instructors.list(),
      ]);
      
      // Load staff for fun dive bookings
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const staffRes = await fetch(`${BASE_URL}/api/staff`).catch(() => ({ ok: false }));
      const staffData = staffRes.ok ? await staffRes.json() : [];
      
      setBookings(b);
      setDivers(d);
      setGroups(g);
      setCourses(c);
      setAccommodations(a);
      setStats(s);
      setInstructors(ins || []);
      setStaff(staffData || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const calcTotal = () => {
    let total = 0;
    const course = courses.find((c) => c.id === form.course_id);
    if (course) total += Number(course.price);
    const acc = accommodations.find((a) => a.id === form.accommodation_id);
    const nights = (form.check_in && form.check_out)
      ? Math.max(1, Math.ceil((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000))
      : 0;
    if (acc && nights > 0) {
      total += Number(acc.price_per_night) * nights;
    }
    return total;
  };

  const handleOpenForm = (booking?: any) => {
    if (booking) {
      setEditingId(booking.id);
      setForm({
        booking_type: booking.group_id ? "fun_dive" : "course",
        diver_id: booking.diver_id,
        group_id: booking.group_id || "",
        course_id: booking.course_id || "",
        accommodation_id: booking.accommodation_id || "",
        check_in: booking.check_in || "",
        check_out: booking.check_out || "",
        payment_status: booking.payment_status || "unpaid",
        notes: booking.notes || "",
        size: booking.size || "",
        weight: booking.weight || "",
        height: booking.height || "",
        agent_id: booking.agent?.id || "",
        divemaster_id: booking.divemaster_id || "",
        boat_staff_id: booking.boat_staff_id || "",
      });
    } else {
      setEditingId(null);
      setForm({ booking_type: "course", diver_id: "", group_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "", size: "", weight: "", height: "", agent_id: "", divemaster_id: "", boat_staff_id: "" });
    }
    setOpen(true);
  };

  const handleOpenView = (booking: any) => {
    setViewingId(booking.id);
    setViewOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.diver_id) {
      toast({ title: "Error", description: "Diver is required", variant: "destructive" });
      return;
    }

    if (form.booking_type === "course" && !form.course_id) {
      toast({ title: "Error", description: "Course is required for course booking", variant: "destructive" });
      return;
    }

    if (form.booking_type === "fun_dive" && !form.group_id) {
      toast({ title: "Error", description: "Group is required for fun dive booking", variant: "destructive" });
      return;
    }

    const total = calcTotal();
    console.log('Form data before submit:', form);
    console.log('EditingId:', editingId);
    
    try {
      let bookingId = editingId;
      
      const payload = {
        diver_id: form.diver_id,
        course_id: form.booking_type === "course" ? form.course_id : null,
        group_id: form.booking_type === "fun_dive" ? form.group_id : null,
        accommodation_id: form.accommodation_id || null,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        total_amount: total,
        payment_status: form.payment_status,
        notes: form.notes || null,
        size: form.size || null,
        weight: form.weight || null,
        height: form.height || null,
        agent_id: form.agent_id || null,
        divemaster_id: form.booking_type === "fun_dive" ? (form.divemaster_id || null) : null,
        boat_staff_id: form.booking_type === "fun_dive" ? (form.boat_staff_id || null) : null,
      };

      console.log('Payload to send:', payload);
      
      if (editingId) {
        await apiClient.bookings.update(editingId, payload);
        toast({ title: "Success", description: "Booking updated successfully" });
      } else {
        const res = await apiClient.bookings.create(payload);
        bookingId = res.id;
        toast({ title: "Success", description: "Booking created successfully" });
      }

      console.log('Save successful, reloading...');
      setOpen(false);
      setEditingId(null);
      setForm({ booking_type: "course", diver_id: "", group_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "", size: "", weight: "", height: "", agent_id: "", divemaster_id: "", boat_staff_id: "" });
      load();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const togglePayment = async (id: string, current: string) => {
    const next = current === "paid" ? "unpaid" : "paid";
    try {
      await apiClient.bookings.update(id, { payment_status: next });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleInvoiceDownload = async (booking: any) => {
    try {
      const nights = calculateNights(booking.check_in, booking.check_out);
      const accommodationPrice = booking.accommodations?.price_per_night
        ? (booking.accommodations.price_per_night * nights)
        : 0;

      const invoiceData = {
        diver: booking.divers?.name || "Unknown Diver",
        course: booking.courses?.name || "No Course",
        coursePrice: booking.courses?.price || 0,
        accommodation: booking.accommodations?.name || "No Accommodation",
        accommodationPrice: accommodationPrice,
        size: booking.size || '',
        weight: booking.weight || '',
        height: booking.height || '',
        agent: booking.agent?.name || '',
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status,
        invoiceNumber: booking.invoice_number || booking.id,
        dateCreated: new Date(booking.created_at).toLocaleDateString(),
        checkIn: booking.check_in || "",
        checkOut: booking.check_out || "",
      };
      generateInvoicePDF(invoiceData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    }
  };

  const handleInvoicePrint = async (booking: any) => {
    try {
      const nights = calculateNights(booking.check_in, booking.check_out);
      const accommodationPrice = booking.accommodations?.price_per_night
        ? (booking.accommodations.price_per_night * nights)
        : 0;

      const invoiceData = {
        diver: booking.divers?.name || "Unknown Diver",
        course: booking.courses?.name || "No Course",
        coursePrice: booking.courses?.price || 0,
        accommodation: booking.accommodations?.name || "No Accommodation",
        accommodationPrice: accommodationPrice,
        size: booking.size || '',
        weight: booking.weight || '',
        height: booking.height || '',
        agent: booking.agent?.name || '',
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status,
        invoiceNumber: booking.invoice_number || booking.id,
        dateCreated: new Date(booking.created_at).toLocaleDateString(),
        checkIn: booking.check_in || "",
        checkOut: booking.check_out || "",
      };
      printInvoice(invoiceData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to print invoice", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try {
      await apiClient.bookings.delete(id);
      toast({ title: "Success", description: "Booking deleted" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('https://drive.google.com/file/d/1PrpW7MAlWJFAepWbF7ab8SKPd1jlPnY5/view?usp=drive_link', '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Booking Form
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Booking" : "New Booking"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Booking Type Selector */}
              <div>
                <Label>Booking Type *</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant={form.booking_type === "course" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, booking_type: "course", group_id: "" })}
                    className="flex-1"
                  >
                    Course
                  </Button>
                  <Button
                    variant={form.booking_type === "fun_dive" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, booking_type: "fun_dive", course_id: "" })}
                    className="flex-1"
                  >
                    Fun Dive
                  </Button>
                </div>
              </div>

              <div>
                <Label>Diver *</Label>
                <Select value={form.diver_id} onValueChange={(v) => setForm({ ...form, diver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select diver" /></SelectTrigger>
                    <SelectContent className="z-[100]">{divers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Course Selection - Only show for course bookings */}
              {form.booking_type === "course" && (
                <div>
                  <Label>Course</Label>
                  <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select course (optional)" /></SelectTrigger>
                      <SelectContent className="z-[100]">{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (${c.price})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {/* Group Selection - Only show for fun dive bookings */}
              {form.booking_type === "fun_dive" && (
                <div>
                  <Label>Group</Label>
                  <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select group (optional)" /></SelectTrigger>
                    <SelectContent className="z-[100]">{groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name} ({g.days} days)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {/* Divemaster Selection - Only show for fun dive bookings */}
              {form.booking_type === "fun_dive" && (
                <div>
                  <Label>Divemaster</Label>
                  <Select value={form.divemaster_id} onValueChange={(v) => setForm({ ...form, divemaster_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select divemaster (optional)" /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="">None</SelectItem>
                      {staff.filter(s => s.role === 'divemaster').map((dm) => (
                        <SelectItem key={dm.id} value={dm.id}>{dm.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Boat Staff Selection - Only show for fun dive bookings */}
              {form.booking_type === "fun_dive" && (
                <div>
                  <Label>Boat Staff</Label>
                  <Select value={form.boat_staff_id} onValueChange={(v) => setForm({ ...form, boat_staff_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select boat staff (optional)" /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="">None</SelectItem>
                      {staff.filter(s => s.role === 'boat_staff').map((bs) => (
                        <SelectItem key={bs.id} value={bs.id}>{bs.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Accommodation</Label>
                <Select value={form.accommodation_id} onValueChange={(v) => setForm({ ...form, accommodation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select accommodation (optional)" /></SelectTrigger>
                    <SelectContent className="z-[100]">{accommodations.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.tier === "free_with_course" ? "Free" : `$${a.price_per_night}/night`})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check In</Label>
                  <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
                </div>
              </div>
              {editingId && (
                <div>
                  <Label>Payment Status</Label>
                  <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[100]">
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Details</Label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <Label>Size</Label>
                    <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g., M, L, XL" />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="kg" />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="cm" />
                  </div>
                </div>

                <div>
                  <Label>Agent</Label>
                  <Select value={form.agent_id} onValueChange={(v) => setForm({ ...form, agent_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select agent (optional)" /></SelectTrigger>
                    <SelectContent className="z-50">
                      {instructors.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${calcTotal()}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Booking Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {viewingId && bookings.find(b => b.id === viewingId) && (() => {
              const b = bookings.find(b => b.id === viewingId)!;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice #</p>
                      <p className="font-mono font-medium">{b.invoice_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Diver</p>
                      <p className="font-medium">{b.divers?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-medium">{b.courses?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Accommodation</p>
                      <p className="font-medium">{b.accommodations?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-medium">{b.check_in || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-medium">{b.check_out || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{b.size || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{b.weight || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="font-medium">{b.height || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agent</p>
                      <p className="font-medium">{b.agent?.name || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{b.notes || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-bold">${Number(b.total_amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <Badge className="mt-1">{b.payment_status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
                    <Button onClick={() => { setViewOpen(false); handleOpenForm(b); }}>Edit</Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Last 30 Days Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.booking_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${Number(stats.total_revenue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${Number(stats.total_amount || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading bookings…</div>
        ) : (
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
                    <div className="flex gap-1">
                      {b.payment_status === "paid" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleInvoiceDownload(b)} title="Download Invoice">
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleInvoicePrint(b)} title="Print Invoice">
                            <Printer className="h-4 w-4 text-blue-600" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpenView(b)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(b)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
