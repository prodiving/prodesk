import { useState, useMemo, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
  parseISO,
  isToday,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  divers?: { name: string };
  courses?: { name: string };
  agent?: { name: string };
  total_amount: number;
  payment_status: string;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'booking';
  description?: string;
  color: string;
  rawData?: any;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const bookingsRes = await apiClient.bookings.list().catch(() => []);

        const events: CalendarEvent[] = [];

        // Add booking events - use check_in date
        if (bookingsRes && Array.isArray(bookingsRes)) {
          bookingsRes.forEach((booking: Booking) => {
            if (booking.check_in) {
              events.push({
                id: `booking-${booking.id}`,
                date: booking.check_in,
                title: `Booking: ${booking.divers?.name || 'N/A'}`,
                type: 'booking',
                description: `Course: ${booking.courses?.name || 'Fun Dive'}`,
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                rawData: booking,
              });
            }
          });
        }

        setEvents(events);
      } catch (error) {
        console.error('Error loading bookings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [toast]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateStr = event.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(event);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return eventsByDate.get(dateStr) || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Calendar</h1>
          <p className="text-muted-foreground">View all bookings scheduled</p>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading calendar...</p>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <div className="grid gap-4">
          {/* Month Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Calendar View */}
          <Card>
            <CardContent className="pt-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-24 p-2 rounded border ${
                        isCurrentMonth ? 'bg-white' : 'bg-muted'
                      } ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate border cursor-pointer hover:shadow-md transition-shadow ${event.color}`}
                            title={event.title}
                            onClick={() => setSelectedEvent(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground p-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Booking Details */}
          {selectedEvent && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <CardDescription>{format(parseISO(selectedEvent.date), 'MMMM dd, yyyy')}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>✕</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEvent.rawData && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Diver</p>
                        <p>{selectedEvent.rawData.divers?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Course</p>
                        <p>{selectedEvent.rawData.courses?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Check-out</p>
                        <p>{selectedEvent.rawData.check_out || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Agent</p>
                        <p>{selectedEvent.rawData.agent?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Total</p>
                        <p className="font-bold">${selectedEvent.rawData.total_amount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Status</p>
                        <Badge>{selectedEvent.rawData.payment_status}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={() => {
                  window.location.href = '/bookings';
                }}>
                  View/Edit Booking
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bookings for {format(currentDate, 'MMMM yyyy')}</CardTitle>
              <CardDescription>All scheduled bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground">No bookings scheduled</p>
              ) : (
                <div className="space-y-2">
                  {events
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${event.color}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(event.date), 'MMM dd, yyyy')}
                            </div>
                            {event.description && (
                              <div className="text-xs mt-1">{event.description}</div>
                            )}
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
