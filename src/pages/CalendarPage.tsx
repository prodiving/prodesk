import { useState, useMemo } from 'react';
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
import { useTrips } from '@/hooks/useTrips';
import { useIncidents } from '@/hooks/useIncidents';
import { apiClient } from '@/integrations/api/client';
import { useEffect } from 'react';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'booking' | 'course' | 'incident' | 'staff';
  description?: string;
  color: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { trips } = useTrips();
  const { incidents } = useIncidents();

  // Load bookings and courses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, coursesRes] = await Promise.all([
          apiClient.bookings.list().catch(() => []),
          apiClient.courses.list().catch(() => []),
        ]);

        const events: CalendarEvent[] = [];

        // Add booking events
        if (bookingsRes && Array.isArray(bookingsRes)) {
          bookingsRes.forEach((booking: any) => {
            if (booking.start_date) {
              events.push({
                id: `booking-${booking.id}`,
                date: booking.start_date,
                title: `Booking: ${booking.user_name || 'N/A'}`,
                type: 'booking',
                description: `${booking.number_of_divers || 0} divers`,
                color: 'bg-blue-100 text-blue-800 border-blue-300',
              });
            }
          });
        }

        // Add course events
        if (coursesRes && Array.isArray(coursesRes)) {
          coursesRes.forEach((course: any) => {
            if (course.start_date) {
              events.push({
                id: `course-${course.id}`,
                date: course.start_date,
                title: `Course: ${course.name || 'N/A'}`,
                type: 'course',
                description: course.instructor_name,
                color: 'bg-green-100 text-green-800 border-green-300',
              });
            }
          });
        }

        // Add trip events
        trips.forEach((trip: any) => {
          if (trip.start_at) {
            events.push({
              id: `trip-${trip.id}`,
              date: trip.start_at.split('T')[0],
              title: `Trip: ${trip.name || trip.location || 'N/A'}`,
              type: 'booking',
              description: trip.description,
              color: 'bg-purple-100 text-purple-800 border-purple-300',
            });
          }
        });

        // Add incident events
        incidents.forEach((incident: any) => {
          if (incident.reported_at) {
            events.push({
              id: `incident-${incident.id}`,
              date: incident.reported_at.split('T')[0],
              title: `Incident: ${incident.severity || 'Report'}`,
              type: 'incident',
              description: incident.description,
              color: 'bg-red-100 text-red-800 border-red-300',
            });
          }
        });

        setEvents(events);
      } catch (error) {
        console.error('Error loading calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [trips, incidents]);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Bookings, courses, staff, and incidents</p>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading calendar events...</p>
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
                            className={`text-xs p-1 rounded truncate border ${event.color}`}
                            title={event.title}
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

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">Booking</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-300">Course</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">Trip</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 border-red-300">Incident</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Events</CardTitle>
              <CardDescription>Complete event list for {format(currentDate, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground">No events scheduled</p>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter((e) => {
                      const eventDate = parseISO(e.date);
                      return isSameMonth(eventDate, currentDate);
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded border-l-4 ${event.color}`}
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
