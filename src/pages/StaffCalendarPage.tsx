import { useState, useEffect } from "react";
import { Calendar, Users, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  availability: string;
  certifications_valid_until: string;
}

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  divemaster?: { id: string; name: string };
  boat_staff?: { id: string; name: string };
  groups?: { name: string };
  courses?: { name: string };
}

export default function StaffCalendarPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, bookingsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/staff`),
        fetch(`${BASE_URL}/api/bookings`)
      ]);

      if (!staffRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to load data');
      }

      const staffData = await staffRes.json();
      const bookingsData = await bookingsRes.json();

      setStaff(staffData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff calendar data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const getMonthDates = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const dates = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const getBookingsForDate = (date: Date, staffId: string) => {
    return bookings.filter(booking => {
      if (!booking.check_in) return false;
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out || booking.check_in);
      const targetDate = new Date(date);

      // Check if date falls within booking period
      const isInRange = targetDate >= checkIn && targetDate <= checkOut;

      // Check if staff is assigned to this booking
      const isAssigned = (booking.divemaster?.id === staffId) || (booking.boat_staff?.id === staffId);

      return isInRange && isAssigned;
    });
  };

  const getStaffByRole = (role: string) => {
    return staff.filter(member => member.role === role);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const dates = viewMode === 'week' ? getWeekDates(currentDate) : getMonthDates(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading staff calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Calendar</h1>
          <p className="text-muted-foreground">View staff assignments and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              ←
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {viewMode === 'week'
                ? `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              →
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="instructors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="divemasters">Divemasters</TabsTrigger>
          <TabsTrigger value="boat_staff">Boat Staff</TabsTrigger>
        </TabsList>

        {['instructors', 'divemasters', 'boat_staff'].map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <div className="grid gap-4">
              {getStaffByRole(role).map((member) => (
                <Card key={member.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {member.name}
                      </div>
                      <Badge variant={member.availability === 'available' ? 'default' : 'secondary'}>
                        {member.availability}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1">
                      {dates.map((date) => {
                        const dayBookings = getBookingsForDate(date, member.id);
                        const hasBooking = dayBookings.length > 0;
                        const isCurrentDay = isToday(date);
                        const isPastDay = isPast(date);

                        return (
                          <div
                            key={date.toISOString()}
                            className={`
                              p-2 text-center text-sm border rounded-md min-h-[60px] flex flex-col items-center justify-center
                              ${isCurrentDay ? 'bg-blue-50 border-blue-200' : ''}
                              ${isPastDay ? 'bg-gray-50 text-gray-400' : ''}
                              ${hasBooking ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}
                            `}
                          >
                            <div className="font-medium">{formatDate(date)}</div>
                            {hasBooking && (
                              <div className="mt-1 space-y-1">
                                {dayBookings.map((booking) => (
                                  <div key={booking.id} className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                    {booking.groups?.name || booking.courses?.name || 'Booking'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getStaffByRole(role).length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No {role.replace('_', ' ')} found
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Certification Expiry Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Certification Expiry Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staff
              .filter(member => {
                if (!member.certifications_valid_until) return false;
                const expiryDate = new Date(member.certifications_valid_until);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              })
              .map(member => {
                const expiryDate = new Date(member.certifications_valid_until!);
                const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{member.name}</span>
                      <span className="text-sm text-muted-foreground">({member.role})</span>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      Expires in {daysLeft} days
                    </Badge>
                  </div>
                );
              })}
            {staff.filter(member => {
              if (!member.certifications_valid_until) return false;
              const expiryDate = new Date(member.certifications_valid_until);
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            }).length === 0 && (
              <p className="text-muted-foreground text-center py-4">No upcoming certification expiries</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}