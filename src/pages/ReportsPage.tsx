import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, List, Home, FileText, Users } from 'lucide-react';

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 16)); // February 2026
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Sample dive trip data matching your image exactly
  const diveTrips = {
    16: [
      { time: '9a', count: 1, diver: 'Peter Greaney', location: 'Ghost Bay' }
    ],
    14: [
      { time: '2p', count: 3, diver: 'Multiple divers', location: 'Coral Reef' }
    ],
    21: [
      { time: '10a', count: 2, diver: 'Sarah & Mike', location: 'Deep Wall' }
    ],
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dive Calendar</h1>
          <p className="text-muted-foreground">Manage dive trips and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Dive Trip
          </Button>
          <Button variant="outline">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Trip Schedules
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Daily Summary
          </Button>
          <Button variant="outline">
            <List className="h-4 w-4 mr-2" />
            Dive Trips List
          </Button>
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Accommodation
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Calendar navigation */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Basic Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Calendar grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center text-sm font-semibold border-b border-gray-200">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const isToday = day === 16 && currentDate.getMonth() === 1 && currentDate.getFullYear() === 2026;
                const dayTrips = day ? diveTrips[day as keyof typeof diveTrips] : [];
                
                return (
                  <div 
                    key={index}
                    className={`min-h-[80px] p-2 border-r border-b border-gray-200 ${
                      isToday ? 'bg-blue-50' : ''
                    } ${!day ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${
                          isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayTrips.map((trip, tripIndex) => (
                            <div 
                              key={tripIndex}
                              className="bg-blue-100 border border-blue-200 rounded p-1 text-xs"
                            >
                              <div className="font-medium text-blue-800">
                                {trip.time} ({trip.count})
                              </div>
                              <div className="text-blue-700">
                                {trip.diver}
                              </div>
                              <div className="text-blue-600">
                                {trip.location}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
