import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Clock } from 'lucide-react';
import { apiClient } from "@/integrations/api/client";

interface DiveTrip {
  id: string;
  time: string;
  count: number;
  diver: string;
  location: string;
}

interface Diver {
  id: string;
  name: string;
  level?: string;
  certification_level?: string;
}

interface DailySummaryProps {
  currentDate?: Date;
  onDateChange?: (date: Date | ((prev: Date) => Date)) => void;
}

export default function DailySummary({ currentDate: propCurrentDate, onDateChange }: DailySummaryProps) {
  const navigate = useNavigate();
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const currentDate = propCurrentDate || internalCurrentDate;
  const setCurrentDate = onDateChange || setInternalCurrentDate;
  const [todayTrips, setTodayTrips] = useState<DiveTrip[]>([]);
  const [unassignedDivers, setUnassignedDivers] = useState<Diver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [bookingsRes, diversRes] = await Promise.all([
          apiClient.bookings.list().catch(() => []),
          apiClient.divers.list().catch(() => []),
        ]);

        // Filter bookings for today
        const today = new Date(currentDate);
        const todayStr = today.toISOString().split('T')[0];
        
        const todayBookings = Array.isArray(bookingsRes) ? 
          bookingsRes.filter((b: any) => b.check_in?.startsWith(todayStr)) : 
          [];

        // Group by time and location
        const trips: DiveTrip[] = todayBookings.map((booking: any, index: number) => ({
          id: booking.id,
          time: booking.check_in ? new Date(booking.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          count: 1,
          diver: booking.divers?.name || 'Unknown',
          location: 'Dive Site', // Would need more info from API
        }));

        setTodayTrips(trips);

        // Unassigned divers (sample - ideally would come from a separate API endpoint)
        const allDivers = Array.isArray(diversRes) ? diversRes : [];
        const assignedDiverIds = new Set(todayBookings.map((b: any) => b.diver_id));
        const unassigned = allDivers
          .filter((d: any) => !assignedDiverIds.has(d.id))
          .slice(0, 5)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            level: d.certification_level || 'Certified',
          }));

        setUnassignedDivers(unassigned);
      } catch (err) {
        console.error('Failed to load daily summary', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const totalDivers = todayTrips.reduce((sum, trip) => sum + trip.count, 0);
  const totalUnassigned = unassignedDivers.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <p className="text-muted-foreground">Loading today's summary...</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <h2 className="text-xl font-semibold">
                {formatDate(currentDate)}
              </h2>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {totalDivers} Divers
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {todayTrips.length} Trips
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Dive Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Today's Dive Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No dive trips scheduled for today
              </div>
            ) : (
              <div className="space-y-4">
                {todayTrips.map((trip, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{trip.time}</span>
                          <Badge variant="secondary">{trip.count} divers</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{trip.diver}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.location}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/calendar')}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned Divers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Unassigned Divers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedDivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                All divers are assigned to trips
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Total Available: {totalUnassigned}</span>
                  <Button variant="outline" size="sm">
                    Assign All
                  </Button>
                </div>
                {unassignedDivers.map((diver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{diver.name}</div>
                      <div className="text-sm text-muted-foreground">{diver.level}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => alert('Assign functionality coming soon')}>
                        Assign
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/divers')}>
                        Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
