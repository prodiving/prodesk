import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { useIncidents } from '@/hooks/useIncidents';
import { apiClient } from '@/integrations/api/client';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'booking' | 'course' | 'incident' | 'staff';
  description?: string;
  color: string;
  rawData?: any;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [diveSites, setDiveSites] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [tripForm, setTripForm] = useState({
    name: '',
    tripType: 'regular',
    departureTime: new Date().toISOString().slice(0, 16),
    diveSiteId: '',
    boatId: '',
    captainId: '',
    numberOfDives: '1',
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduleName: '',
    departureTime: '09:00',
    departureLocation: '',
    boat: '',
    numberOfDives: '0',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysAhead: '30',
    daysOfWeek: {
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    },
    diveSites: '',
    products: '',
  });
  const { trips } = useTrips();
  const { incidents } = useIncidents();
  const { toast } = useToast();

  // Load bookings and courses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, coursesRes, diveSitesRes, boatsRes, instructorsRes] = await Promise.all([
          apiClient.bookings.list().catch(() => []),
          apiClient.courses.list().catch(() => []),
          apiClient.diveSites.list().catch(() => []),
          apiClient.boats.list().catch(() => []),
          apiClient.instructors.list().catch(() => []),
        ]);

        const events: CalendarEvent[] = [];

        // Store dive sites, boats, and instructors for the form
        setDiveSites(Array.isArray(diveSitesRes) ? diveSitesRes : []);
        setBoats(Array.isArray(boatsRes) ? boatsRes : []);
        setInstructors(Array.isArray(instructorsRes) ? instructorsRes : []);

        // Add booking events - use check_in date
        if (bookingsRes && Array.isArray(bookingsRes)) {
          bookingsRes.forEach((booking: any) => {
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

        // Add course events
        if (coursesRes && Array.isArray(coursesRes)) {
          coursesRes.forEach((course: any) => {
            // Courses may not have start_date, so we'll skip them if not available
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

  const handleCreateTrip = async () => {
    if (!tripForm.name || !tripForm.departureTime || !tripForm.diveSiteId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: tripForm.name,
          type: tripForm.tripType,
          start_at: tripForm.departureTime,
          dive_site_id: tripForm.diveSiteId,
          boat_id: tripForm.boatId || null,
          captain_id: tripForm.captainId || null,
          number_of_dives: parseInt(tripForm.numberOfDives),
        }),
      });

      if (!res.ok) throw new Error('Failed to create trip');

      toast({
        title: 'Success',
        description: 'Dive trip created successfully',
      });

      setShowCreateTripModal(false);
      setTripForm({
        name: '',
        tripType: 'regular',
        departureTime: new Date().toISOString().slice(0, 16),
        diveSiteId: '',
        boatId: '',
        captainId: '',
        numberOfDives: '1',
      });

      // Reload events
      window.location.reload();
    } catch (err) {
      console.error('Failed to create trip:', err);
      toast({
        title: 'Error',
        description: 'Failed to create dive trip',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Bookings, courses, staff, and incidents</p>
        </div>

        {/* Create Dive Trip Button */}
        <Button 
          className="gap-2"
          onClick={() => navigate('/create-dive-trip')}
        >
          <Plus className="w-4 h-4" />
          Create Dive Trip
        </Button>

        {/* Create Dive Trip Schedule Button */}
        <Dialog open={showCreateScheduleModal} onOpenChange={setShowCreateScheduleModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Dive Trip Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Schedule Name */}
              <div>
                <Label htmlFor="schedule-name">Schedule Name *</Label>
                <Input
                  id="schedule-name"
                  placeholder="e.g., Weekly Tuesday Dives"
                  value={scheduleForm.scheduleName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleName: e.target.value })}
                />
              </div>

              {/* Row 1: Departure Time & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dep-time">Departure Time *</Label>
                  <Input
                    id="dep-time"
                    type="time"
                    value={scheduleForm.departureTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dep-location">Departure Location</Label>
                  <Input
                    id="dep-location"
                    placeholder="e.g., Tulamben Drop Off"
                    value={scheduleForm.departureLocation}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, departureLocation: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Boat & Number of Dives */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boat-select">Boat</Label>
                  <Select value={scheduleForm.boat} onValueChange={(value) => setScheduleForm({ ...scheduleForm, boat: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Boat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Boat</SelectItem>
                      {boats.map((boat: any) => (
                        <SelectItem key={boat.id} value={boat.id}>
                          {boat.name || 'Unnamed Boat'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="num-dives-schedule">Number of Dives</Label>
                  <Input
                    id="num-dives-schedule"
                    type="number"
                    min="0"
                    value={scheduleForm.numberOfDives}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, numberOfDives: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited schedule</p>
                </div>
              </div>

              {/* Days Ahead & Days of Week */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="days-ahead">Days Ahead to Keep Populated *</Label>
                  <Input
                    id="days-ahead"
                    type="number"
                    min="1"
                    value={scheduleForm.daysAhead}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, daysAhead: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">How many days in advance should trips be created automatically</p>
                </div>
                <div>
                  <Label>Days of the Week *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(scheduleForm.daysOfWeek).map(([day, checked]) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              daysOfWeek: { ...scheduleForm.daysOfWeek, [day]: e.target.checked },
                            })
                          }
                        />
                        <span className="capitalize text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dive Sites */}
              <div>
                <Label htmlFor="dive-sites">Dive Sites</Label>
                <Input
                  id="dive-sites"
                  placeholder="Select or type dive sites"
                  value={scheduleForm.diveSites}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, diveSites: e.target.value })}
                />
              </div>

              {/* Products */}
              <div>
                <Label htmlFor="products">Products</Label>
                <Input
                  id="products"
                  placeholder="e.g., PADI Open Water Diver, Fun Dive"
                  value={scheduleForm.products}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, products: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowCreateScheduleModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: 'Success',
                    description: 'Dive trip schedule created successfully',
                  });
                  setShowCreateScheduleModal(false);
                  // Reset form
                  setScheduleForm({
                    scheduleName: '',
                    departureTime: '09:00',
                    departureLocation: '',
                    boat: '',
                    numberOfDives: '0',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    daysAhead: '30',
                    daysOfWeek: {
                      sunday: false,
                      monday: false,
                      tuesday: false,
                      wednesday: false,
                      thursday: false,
                      friday: false,
                      saturday: false,
                    },
                    diveSites: '',
                    products: '',
                  });
                }}>
                  Create Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

          {/* Selected Event Details */}
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
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.type === 'booking' && selectedEvent.rawData && (
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
                  if (selectedEvent.rawData) {
                    window.location.href = '/bookings';
                  }
                }}>
                  View/Edit Booking
                </Button>
              </CardContent>
            </Card>
          )}

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
